// src/app/[locale]/(app)/conversations/useConversationSocket.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

function wsUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  return `${backendUrl.replace(/^http/, 'ws')}/ws/conversations/`;
}

export function useConversationSocket({ onDone, onError }: UseConversationSocketOptions) {
  const t = useTranslations('conversations');
  const socketRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef('');
  // Completed tool-call steps for the turn currently in flight, in order —
  // activeTool alone only ever showed the latest one, overwriting the
  // previous step the moment a new frame arrived. A ref (like bufferRef)
  // rather than relying solely on the toolTrace state below, so the 'done'
  // handler reads the up-to-date list rather than a stale closure over it.
  const toolTraceRef = useRef<string[]>([]);
  // Same reasoning: sendConfirmation needs the thread_id a confirm_required
  // frame carried, read reliably rather than through a closure over
  // possibly-stale state.
  const pendingConfirmationRef = useRef<PendingConfirmation | null>(null);
  const [status, setStatus] = useState<SocketStatus>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolTrace, setToolTrace] = useState<string[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const close = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    bufferRef.current = '';
    toolTraceRef.current = [];
    pendingConfirmationRef.current = null;
    setStatus('idle');
    setStreamingText('');
    setActiveTool(null);
    setToolTrace([]);
    setPendingConfirmation(null);
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
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      try {
        socket = await openSocket();
      } catch {
        setStatus('error');
        onError(t('connectionFailed'));
        return null;
      }
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as ServerFrame;
      if ('chunk' in data) {
        bufferRef.current += data.chunk;
        setStreamingText(bufferRef.current);
        setActiveTool(null);
        setPendingConfirmation(null);
        setStatus('streaming');
      } else if ('status' in data) {
        setStatus(data.status);
        setActiveTool(data.status === 'tool_call' || data.status === 'confirm_required' ? data.tool : null);
        const confirmation =
          data.status === 'confirm_required'
            ? { tool: data.tool, arguments: data.arguments, threadId: data.thread_id }
            : null;
        pendingConfirmationRef.current = confirmation;
        setPendingConfirmation(confirmation);
        if (data.status === 'tool_call') {
          toolTraceRef.current = [...toolTraceRef.current, data.tool];
          setToolTrace(toolTraceRef.current);
        }
      } else if ('done' in data) {
        onDone(bufferRef.current, data.thread_id, toolTraceRef.current);
        bufferRef.current = '';
        toolTraceRef.current = [];
        pendingConfirmationRef.current = null;
        setStreamingText('');
        setActiveTool(null);
        setToolTrace([]);
        setPendingConfirmation(null);
        setStatus('idle');
      } else if ('error' in data) {
        setStatus('error');
        pendingConfirmationRef.current = null;
        setPendingConfirmation(null);
        onError(data.error);
      }
    };

    socket.onerror = () => {
      setStatus('error');
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
      bufferRef.current = '';
      toolTraceRef.current = [];
      pendingConfirmationRef.current = null;
      setStatus('error');
      setStreamingText('');
      setActiveTool(null);
      setToolTrace([]);
      setPendingConfirmation(null);
      onError(t('connectionLost'));
    };

    return socket;
  }, [openSocket, onDone, onError, t]);

  const sendMessage = useCallback(
    async (threadId: number | null, text: string, aiProvider?: string, model?: string, projectId?: number) => {
      setStatus('connecting');
      bufferRef.current = '';
      toolTraceRef.current = [];
      pendingConfirmationRef.current = null;
      setStreamingText('');
      setActiveTool(null);
      setToolTrace([]);
      setPendingConfirmation(null);

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
    const threadId = pendingConfirmationRef.current?.threadId;
    if (!socket || socket.readyState !== WebSocket.OPEN || threadId === undefined) return;
    pendingConfirmationRef.current = null;
    setPendingConfirmation(null);
    setStatus('thinking');
    socket.send(JSON.stringify({ type: 'tool_confirmation', thread_id: threadId, confirmed }));
  }, []);

  return {
    sendMessage,
    attachToThread,
    sendConfirmation,
    status,
    streamingText,
    activeTool,
    toolTrace,
    pendingConfirmation,
    close,
  };
}
