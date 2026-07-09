// src/app/[locale]/(app)/conversations/useConversationSocket.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type SocketStatus = 'idle' | 'connecting' | 'thinking' | 'tool_call' | 'confirm_required' | 'streaming' | 'error';

export interface PendingConfirmation {
  tool: string;
  arguments: Record<string, unknown>;
}

interface ChunkFrame {
  chunk: string;
}
interface ThinkingStatusFrame {
  status: 'thinking';
}
interface ToolCallStatusFrame {
  status: 'tool_call';
  tool: string;
}
interface ConfirmRequiredStatusFrame {
  status: 'confirm_required';
  tool: string;
  arguments: Record<string, unknown>;
}
type StatusFrame = ThinkingStatusFrame | ToolCallStatusFrame | ConfirmRequiredStatusFrame;
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

  const sendMessage = useCallback(
    async (threadId: number | null, text: string, aiProvider?: string, model?: string, projectId?: number) => {
      setStatus('connecting');
      bufferRef.current = '';
      toolTraceRef.current = [];
      setStreamingText('');
      setActiveTool(null);
      setToolTrace([]);
      setPendingConfirmation(null);

      let socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        try {
          socket = await openSocket();
        } catch {
          setStatus('error');
          onError(t('connectionFailed'));
          return;
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
          setPendingConfirmation(data.status === 'confirm_required' ? { tool: data.tool, arguments: data.arguments } : null);
          if (data.status === 'tool_call') {
            toolTraceRef.current = [...toolTraceRef.current, data.tool];
            setToolTrace(toolTraceRef.current);
          }
        } else if ('done' in data) {
          onDone(bufferRef.current, data.thread_id, toolTraceRef.current);
          bufferRef.current = '';
          toolTraceRef.current = [];
          setStreamingText('');
          setActiveTool(null);
          setToolTrace([]);
          setPendingConfirmation(null);
          setStatus('idle');
        } else if ('error' in data) {
          setStatus('error');
          setPendingConfirmation(null);
          onError(data.error);
        }
      };

      socket.onerror = () => {
        setStatus('error');
        onError(t('connectionLost'));
      };

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
    [openSocket, onDone, onError, t],
  );

  const sendConfirmation = useCallback((confirmed: boolean) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    setPendingConfirmation(null);
    setStatus('thinking');
    socket.send(JSON.stringify({ type: 'tool_confirmation', confirmed }));
  }, []);

  return { sendMessage, sendConfirmation, status, streamingText, activeTool, toolTrace, pendingConfirmation, close };
}
