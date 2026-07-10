// src/app/[locale]/(app)/conversations/useConversationSocket.ts
'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useTranslations } from 'next-intl';

type SocketStatus = 'idle' | 'connecting' | 'thinking' | 'tool_call' | 'confirm_required' | 'resuming' | 'streaming' | 'error';

export interface PendingConfirmation {
  tool: string;
  arguments: Record<string, unknown>;
  threadId: number;
}

interface ChunkFrame {
  chunk: string;
}
interface ThinkingStatusFrame {
  status: 'thinking';
}
interface ResumingStatusFrame {
  status: 'resuming';
}
interface ToolCallStatusFrame {
  status: 'tool_call';
  tool: string;
}
interface ConfirmRequiredStatusFrame {
  status: 'confirm_required';
  tool: string;
  arguments: Record<string, unknown>;
  thread_id: number;
}
type StatusFrame = ThinkingStatusFrame | ResumingStatusFrame | ToolCallStatusFrame | ConfirmRequiredStatusFrame;
interface DoneFrame {
  done: true;
  thread_id: number;
}
interface ErrorFrame {
  error: string;
}
type ServerFrame = ChunkFrame | StatusFrame | DoneFrame | ErrorFrame;

interface UseConversationSocketOptions {
  onDone: (fullText: string, threadId: number, toolCalls: string[]) => void;
  onError: (message: string) => void;
}

// Single source of truth for everything a turn's lifecycle touches. Previously
// each of these five fields was duplicated as a ref (for synchronous reads
// inside WS event closures) plus a state variable (to trigger re-renders),
// synced by hand at every one of ~4 call sites — 3 pairs x up to 4 sites was
// a lot of places for one of the pair to silently drift from the other (that
// exact class of bug — a status update clearing pendingConfirmation when it
// shouldn't — already happened once). A reducer's update function always
// operates on the true latest state regardless of when the calling closure
// was created, which is what the refs existed to work around in the first
// place — so collapsing to one dispatch call per frame removes the need for
// per-field refs entirely, not just the duplication.
interface SocketState {
  status: SocketStatus;
  streamingText: string;
  activeTool: string | null;
  toolTrace: string[];
  pendingConfirmation: PendingConfirmation | null;
}

const initialState: SocketState = {
  status: 'idle',
  streamingText: '',
  activeTool: null,
  toolTrace: [],
  pendingConfirmation: null,
};

type Action =
  | { type: 'reset' }
  | { type: 'connecting' }
  | { type: 'chunk'; chunk: string }
  | { type: 'status'; status: StatusFrame }
  | { type: 'done' }
  | { type: 'error' }
  | { type: 'confirmed' };

function reducer(state: SocketState, action: Action): SocketState {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'connecting':
      return { ...initialState, status: 'connecting' };
    case 'chunk':
      return {
        ...state,
        streamingText: state.streamingText + action.chunk,
        activeTool: null,
        pendingConfirmation: null,
        status: 'streaming',
      };
    case 'status': {
      const frame = action.status;
      if (frame.status === 'tool_call') {
        return {
          ...state,
          status: 'tool_call',
          activeTool: frame.tool,
          pendingConfirmation: null,
          toolTrace: [...state.toolTrace, frame.tool],
        };
      }
      if (frame.status === 'confirm_required') {
        return {
          ...state,
          status: 'confirm_required',
          activeTool: frame.tool,
          pendingConfirmation: { tool: frame.tool, arguments: frame.arguments, threadId: frame.thread_id },
        };
      }
      // 'thinking' | 'resuming'
      return { ...state, status: frame.status, activeTool: null, pendingConfirmation: null };
    }
    case 'done':
      return initialState;
    case 'error':
      return { ...initialState, status: 'error' };
    case 'confirmed':
      return { ...state, status: 'thinking', pendingConfirmation: null };
    default:
      return state;
  }
}

function wsUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  return `${backendUrl.replace(/^http/, 'ws')}/ws/conversations/`;
}

export function useConversationSocket({ onDone, onError }: UseConversationSocketOptions) {
  const t = useTranslations('conversations');
  const socketRef = useRef<WebSocket | null>(null);
  // Guards against ensureSocket racing itself: if a connection is already
  // in flight (e.g. the eager attach-on-mount effect overlaps a user
  // hitting send before the handshake finishes), every caller awaits this
  // same promise instead of each opening its own WebSocket. Without it,
  // socketRef.current gets clobbered by whichever attempt started last, and
  // an earlier attempt erroring out fires a spurious "connection failed"
  // even though the surviving socket is healthy.
  const connectingRef = useRef<Promise<WebSocket> | null>(null);

  const [state, dispatch] = useReducer(reducer, initialState);
  // The one remaining ref: mirrors the latest committed state so that
  // callbacks with an empty/stable dependency array (sendConfirmation) and
  // the WS onmessage closure (reassigned only when ensureSocket's own deps
  // change, not on every frame) can read the true-current turn data — e.g.
  // the full accumulated text for onDone — without needing to be recreated
  // every time state changes.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const close = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    dispatch({ type: 'reset' });
  }, []);

  useEffect(() => close, [close]);

  const openSocket = useCallback(() => {
    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(wsUrl());
      socket.onopen = () => resolve(socket);
      socket.onerror = () => reject(new Error('WebSocket connection failed'));
      socketRef.current = socket;
    });
  }, []);

  // Shared by sendMessage and attachToThread — both need a live socket with
  // the same frame-handling wired up, they just send a different first
  // message on it.
  const ensureSocket = useCallback(async (): Promise<WebSocket | null> => {
    let socket = socketRef.current;
    if (!socket || socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
      if (!connectingRef.current) {
        connectingRef.current = openSocket().finally(() => {
          connectingRef.current = null;
        });
      }
      try {
        socket = await connectingRef.current;
      } catch {
        dispatch({ type: 'error' });
        onError(t('connectionFailed'));
        return null;
      }
    } else if (socket.readyState === WebSocket.CONNECTING && connectingRef.current) {
      try {
        socket = await connectingRef.current;
      } catch {
        dispatch({ type: 'error' });
        onError(t('connectionFailed'));
        return null;
      }
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as ServerFrame;
      if ('chunk' in data) {
        dispatch({ type: 'chunk', chunk: data.chunk });
      } else if ('status' in data) {
        dispatch({ type: 'status', status: data });
      } else if ('done' in data) {
        onDone(stateRef.current.streamingText, data.thread_id, stateRef.current.toolTrace);
        dispatch({ type: 'done' });
      } else if ('error' in data) {
        dispatch({ type: 'error' });
        onError(data.error);
      }
    };

    socket.onerror = () => {
      dispatch({ type: 'error' });
      onError(t('connectionLost'));
    };

    socket.onclose = () => {
      // The connection can die mid-turn for reasons that never produce a
      // frame at all (a server-side crash mid-stream, a network blip) —
      // without this, status stays stuck on 'connecting'/'thinking'/
      // 'streaming' forever and the send button never re-enables. Only
      // handle it if this socket is still the one in use — close()
      // already nulls socketRef.current synchronously before the
      // resulting native close event reaches here, so a close triggered
      // by our own close()/cleanup is a no-op below, not a double-report.
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      dispatch({ type: 'error' });
      onError(t('connectionLost'));
    };

    return socket;
  }, [openSocket, onDone, onError, t]);

  const sendMessage = useCallback(
    async (threadId: number | null, text: string, aiProvider?: string, model?: string, projectId?: number) => {
      dispatch({ type: 'connecting' });

      const socket = await ensureSocket();
      if (!socket) return;

      socket.send(
        JSON.stringify({
          thread_id: threadId,
          message: text,
          ...(threadId === null && aiProvider ? { ai_provider: aiProvider } : {}),
          ...(threadId === null && model ? { model } : {}),
          ...(threadId === null && projectId ? { project_id: projectId } : {}),
        }),
      );
    },
    [ensureSocket],
  );

  // Attaches to a thread that may already have a generation in flight
  // (e.g. one survived a previous dropped connection, or a second tab is
  // running one) — the server responds with {"status": "resuming"} plus
  // whatever chunks/frames follow if so, or silently does nothing if not.
  const attachToThread = useCallback(
    async (threadId: number) => {
      const socket = await ensureSocket();
      if (!socket) return;
      socket.send(JSON.stringify({ type: 'join_thread', thread_id: threadId }));
    },
    [ensureSocket],
  );

  const sendConfirmation = useCallback((confirmed: boolean) => {
    const socket = socketRef.current;
    const threadId = stateRef.current.pendingConfirmation?.threadId;
    if (!socket || socket.readyState !== WebSocket.OPEN || threadId === undefined) return;
    dispatch({ type: 'confirmed' });
    socket.send(JSON.stringify({ type: 'tool_confirmation', thread_id: threadId, confirmed }));
  }, []);

  return {
    sendMessage,
    attachToThread,
    sendConfirmation,
    status: state.status,
    streamingText: state.streamingText,
    activeTool: state.activeTool,
    toolTrace: state.toolTrace,
    pendingConfirmation: state.pendingConfirmation,
    close,
  };
}
