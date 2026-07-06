// src/app/[locale]/(app)/conversations/useConversationSocket.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  onDone: (fullText: string, threadId: number) => void;
  onError: (message: string) => void;
}

function wsUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  return `${backendUrl.replace(/^http/, 'ws')}/ws/conversations/`;
}

export function useConversationSocket({ onDone, onError }: UseConversationSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef('');
  const [status, setStatus] = useState<SocketStatus>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const close = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    bufferRef.current = '';
    setStatus('idle');
    setStreamingText('');
    setActiveTool(null);
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
      setStreamingText('');
      setActiveTool(null);
      setPendingConfirmation(null);

      let socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        try {
          socket = await openSocket();
        } catch {
          setStatus('error');
          onError('Could not connect to the chat.');
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
        } else if ('done' in data) {
          onDone(bufferRef.current, data.thread_id);
          bufferRef.current = '';
          setStreamingText('');
          setActiveTool(null);
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
        onError('Lost connection to the chat.');
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
    [openSocket, onDone, onError],
  );

  const sendConfirmation = useCallback((confirmed: boolean) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    setPendingConfirmation(null);
    setStatus('thinking');
    socket.send(JSON.stringify({ type: 'tool_confirmation', confirmed }));
  }, []);

  return { sendMessage, sendConfirmation, status, streamingText, activeTool, pendingConfirmation, close };
}
