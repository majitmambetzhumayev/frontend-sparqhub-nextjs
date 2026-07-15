// src/app/[locale]/(app)/conversations/useConversationSocket.ts
'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useTranslations } from 'next-intl';

type SocketStatus = 'idle' | 'connecting' | 'thinking' | 'tool_call' | 'confirm_required' | 'resuming' | 'streaming' | 'delegating' | 'error';

export interface PendingConfirmation {
  tool: string;
  arguments: Record<string, unknown>;
  threadId: number;
}

// thread_id rides on every broadcast frame (chunk/status/error) so a
// connection that's still joined to a previous thread's Channels group
// (navigation never explicitly leaves it, see the App Router note on
// useConversationSocket's threadId param below) can be told apart from the
// thread currently on screen. Absent only on frames that are a direct,
// synchronous reply to this connection's own last action (never a group
// broadcast, so never at risk of arriving late for the wrong thread).
interface ChunkFrame {
  chunk: string;
  thread_id: number;
}
interface ThinkingStatusFrame {
  status: 'thinking';
  thread_id: number;
}
interface ResumingStatusFrame {
  status: 'resuming';
  thread_id?: number;
}
interface ToolCallStatusFrame {
  status: 'tool_call';
  tool: string;
  thread_id: number;
}
interface ConfirmRequiredStatusFrame {
  status: 'confirm_required';
  tool: string;
  arguments: Record<string, unknown>;
  thread_id: number;
}
interface DelegatingStatusFrame {
  status: 'delegating';
  provider: string;
  thread_id: number;
}
type StatusFrame =
  | ThinkingStatusFrame
  | ResumingStatusFrame
  | ToolCallStatusFrame
  | ConfirmRequiredStatusFrame
  | DelegatingStatusFrame;
interface DoneFrame {
  done: true;
  thread_id: number;
  stopped?: boolean;
}
interface ErrorFrame {
  error: string;
  thread_id?: number;
}
type ServerFrame = ChunkFrame | StatusFrame | DoneFrame | ErrorFrame;

interface UseConversationSocketOptions {
  // The thread currently displayed by the caller — null while a
  // brand-new thread is still being created (see /conversations/new).
  // Navigating between /conversations/A and /conversations/B does NOT
  // remount the page component (both match the same [threadId] route
  // template), so this hook's own state would otherwise silently keep
  // showing thread A's in-flight turn under thread B's header. Passing
  // threadId in lets the hook reset its transient state and start
  // filtering out any stale frame still arriving from A's Channels group
  // (this connection is never explicitly removed from a thread's group on
  // navigation, only on disconnect).
  threadId: number | null;
  onDone: (fullText: string, threadId: number, toolCalls: string[], stopped: boolean) => void;
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
  delegatingProvider: string | null;
}

const initialState: SocketState = {
  status: 'idle',
  streamingText: '',
  activeTool: null,
  toolTrace: [],
  pendingConfirmation: null,
  delegatingProvider: null,
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
        delegatingProvider: null,
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
          delegatingProvider: null,
          toolTrace: [...state.toolTrace, frame.tool],
        };
      }
      if (frame.status === 'confirm_required') {
        return {
          ...state,
          status: 'confirm_required',
          activeTool: frame.tool,
          pendingConfirmation: { tool: frame.tool, arguments: frame.arguments, threadId: frame.thread_id },
          delegatingProvider: null,
        };
      }
      if (frame.status === 'delegating') {
        // The delegated call (a fresh LLM round-trip, possibly with its own
        // tool use like image generation) used to report nothing at all
        // between confirmation and its own completion — status just sat on
        // 'thinking' the whole time, indistinguishable from a normal pause.
        return {
          ...state,
          status: 'delegating',
          activeTool: null,
          pendingConfirmation: null,
          delegatingProvider: frame.provider,
        };
      }
      // 'thinking' | 'resuming'
      return { ...state, status: frame.status, activeTool: null, pendingConfirmation: null, delegatingProvider: null };
    }
    case 'done':
      return initialState;
    case 'error':
      return { ...initialState, status: 'error' };
    case 'confirmed':
      return { ...state, status: 'thinking', pendingConfirmation: null, delegatingProvider: null };
    default:
      return state;
  }
}

function wsUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  return `${backendUrl.replace(/^http/, 'ws')}/ws/conversations/`;
}

const MAX_RECONNECT_DELAY_MS = 15000;

export function useConversationSocket({ threadId, onDone, onError }: UseConversationSocketOptions) {
  const t = useTranslations('conversations');
  const socketRef = useRef<WebSocket | null>(null);
  // The thread this hook instance is currently bound to, for filtering out
  // stale frames from a previous thread's still-joined group. Starts at
  // `threadId` itself (not null) so a mount directly onto an existing
  // thread doesn't briefly accept frames meant for whatever thread this
  // shared connection was last attached to. Kept in sync with the
  // `threadId` prop below; also adopted from the first frame received
  // while still null (the /conversations/new case — the real id isn't
  // known until the backend assigns it and starts broadcasting).
  const activeThreadIdRef = useRef<number | null>(threadId);
  // Guards against ensureSocket racing itself: if a connection is already
  // in flight (e.g. the eager attach-on-mount effect overlaps a user
  // hitting send before the handshake finishes), every caller awaits this
  // same promise instead of each opening its own WebSocket. Without it,
  // socketRef.current gets clobbered by whichever attempt started last, and
  // an earlier attempt erroring out fires a spurious "connection failed"
  // even though the surviving socket is healthy.
  const connectingRef = useRef<Promise<WebSocket> | null>(null);
  // The thread a reconnect should re-attach to, if the connection drops.
  // Only ever set to a real thread id (never null) — a brand-new thread
  // being created via sendMessage(null, ...) has nothing to reconnect to
  // until the 'done' frame delivers its id, at which point it's captured.
  // Deliberately never used to *resend* the user's message on reconnect —
  // only to rejoin the thread's group and see whatever's still going.
  const lastThreadIdRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fires on mount and on every real thread switch (the [threadId]/page.tsx
  // case — see UseConversationSocketOptions.threadId). Updating the ref
  // synchronously here (before any frame for the new thread has arrived)
  // is what makes onmessage's filter below correct immediately, not just
  // eventually; dispatching reset clears the previous thread's
  // streamingText/status/etc. from the screen right away instead of
  // leaving it visible until the new thread's first frame shows up.
  useEffect(() => {
    activeThreadIdRef.current = threadId;
    dispatch({ type: 'reset' });
  }, [threadId]);

  const clearScheduledReconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearScheduledReconnect();
    lastThreadIdRef.current = null;
    socketRef.current?.close();
    socketRef.current = null;
    dispatch({ type: 'reset' });
  }, [clearScheduledReconnect]);

  // Deliberately NOT wired to an unmount effect (no `useEffect(() => close,
  // [close])` here). That pattern looks idiomatic but is broken under React
  // Strict Mode's dev-only double-invoke: on the first real mount, Strict
  // Mode runs this effect's cleanup once as a simulated unmount, which
  // called close() while ensureSocket()'s connection was still CONNECTING —
  // aborting it and surfacing a spurious "Could not connect to the chat."
  // every single time a conversation was opened, with join_thread never
  // actually reaching the server (so an in-flight generation's "resuming"
  // state was silently missed too). The socket doesn't need eager cleanup
  // to be correct: the backend's disconnect() already tears down group
  // membership independent of how/when the TCP connection actually closes,
  // and ensureSocket transparently reopens/reuses as needed. `close` stays
  // available for an explicit future caller (e.g. an intentional
  // "leave chat" action) — it just isn't auto-invoked on every unmount.
  const openSocket = useCallback(() => {
    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(wsUrl());
      socket.onopen = () => {
        // A live connection again — the backoff schedule (and anything it
        // already queued) no longer applies.
        reconnectAttemptRef.current = 0;
        clearScheduledReconnect();
        resolve(socket);
      };
      socket.onerror = () => reject(new Error('WebSocket connection failed'));
      socketRef.current = socket;
    });
  }, [clearScheduledReconnect]);

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
      if (typeof data.thread_id === 'number') {
        if (activeThreadIdRef.current === null) {
          // Don't know our own thread yet (a brand-new thread being
          // created) — the first frame to carry an id tells us which one
          // this connection's send actually created.
          activeThreadIdRef.current = data.thread_id;
        } else if (data.thread_id !== activeThreadIdRef.current) {
          // Broadcast from a thread this page navigated away from — this
          // connection is still in its Channels group (only disconnect
          // leaves a group, not a thread switch), but it no longer belongs
          // on screen.
          return;
        }
      }
      if ('chunk' in data) {
        dispatch({ type: 'chunk', chunk: data.chunk });
      } else if ('status' in data) {
        dispatch({ type: 'status', status: data });
      } else if ('done' in data) {
        // A brand-new thread (sendMessage with threadId: null) only gets an
        // id once this frame arrives — capture it so a later drop on this
        // same thread can still reconnect.
        lastThreadIdRef.current = data.thread_id;
        onDone(stateRef.current.streamingText, data.thread_id, stateRef.current.toolTrace, Boolean(data.stopped));
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

      // Auto-reconnect: a generation can outlive this connection entirely
      // (see the backend's generation_registry) — losing the socket is no
      // longer the same as losing the response, so the UI shouldn't just
      // sit on an error until the user manually reloads. Only re-attaches
      // (join_thread) to whatever thread was last active; never resends a
      // message, to avoid double-posting. Exponential backoff, capped, and
      // reset on the next successful connection (see openSocket's onopen).
      // ensureSocket is referenced here via the outer `const` binding it's
      // being assigned to — safe because this closure only runs later, at
      // which point that binding is fully initialized, not during render.
      const threadId = lastThreadIdRef.current;
      if (threadId === null) return;
      const attempt = reconnectAttemptRef.current;
      reconnectAttemptRef.current += 1;
      const delay = Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        void ensureSocket().then((reconnectedSocket) => {
          reconnectedSocket?.send(JSON.stringify({ type: 'join_thread', thread_id: threadId }));
        });
      }, delay);
    };

    return socket;
  }, [openSocket, onDone, onError, t]);

  const sendMessage = useCallback(
    async (threadId: number | null, text: string, aiProvider?: string, model?: string, projectId?: number) => {
      if (threadId !== null) {
        lastThreadIdRef.current = threadId;
      }
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
      lastThreadIdRef.current = threadId;
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

  // Cancels an in-flight generation. Whatever was already streamed is kept
  // (the backend saves partial text on a deliberate stop, same as a normal
  // completion) — this doesn't discard anything client-side either, it just
  // asks the server to stop producing more and finalize what exists.
  const stopGeneration = useCallback((threadId: number) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'stop_generation', thread_id: threadId }));
  }, []);

  return {
    sendMessage,
    attachToThread,
    sendConfirmation,
    stopGeneration,
    status: state.status,
    streamingText: state.streamingText,
    activeTool: state.activeTool,
    toolTrace: state.toolTrace,
    pendingConfirmation: state.pendingConfirmation,
    delegatingProvider: state.delegatingProvider,
    close,
  };
}
