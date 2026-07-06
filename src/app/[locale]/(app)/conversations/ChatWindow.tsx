// src/app/[locale]/(app)/conversations/ChatWindow.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolConfirmationCard from './ToolConfirmationCard';
import type { PendingConfirmation } from './useConversationSocket';

export interface ChatWindowMessage {
  sender: 'user' | 'assistant';
  content: string;
}

export type ChatActivityStatus = 'idle' | 'connecting' | 'thinking' | 'tool_call' | 'confirm_required' | 'streaming' | 'error';

export interface ChatWindowProps {
  messages: ChatWindowMessage[];
  streamingText?: string;
  status?: ChatActivityStatus;
  activeTool?: string | null;
  pendingConfirmation?: PendingConfirmation | null;
  onConfirmTool?: () => void;
  onCancelTool?: () => void;
}

const PROSE_CLASSES =
  'prose prose-neutral max-w-none ' +
  '[--tw-prose-body:var(--color-ink)] [--tw-prose-headings:var(--color-ink)] ' +
  '[--tw-prose-bold:var(--color-ink)] [--tw-prose-bullets:var(--color-ink)]';

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className={PROSE_CLASSES}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

const TOOL_LABELS: Record<string, string> = {
  generate_image: 'Generating image…',
};

function ActivityIndicator({ status, activeTool }: { status: ChatActivityStatus; activeTool?: string | null }) {
  const label =
    status === 'tool_call'
      ? (activeTool && TOOL_LABELS[activeTool]) || `Using tool: ${activeTool}…`
      : 'Thinking…';
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
      </span>
      {label}
    </div>
  );
}

export default function ChatWindow({
  messages,
  streamingText,
  status = 'idle',
  activeTool,
  pendingConfirmation,
  onConfirmTool,
  onCancelTool,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streamingText, status]);

  const showActivityIndicator =
    !streamingText && status !== 'confirm_required' && (status === 'connecting' || status === 'thinking' || status === 'tool_call');
  const showConfirmationCard = status === 'confirm_required' && pendingConfirmation;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !streamingText && !showActivityIndicator && !showConfirmationCard ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          <>
            {messages.map((m, idx) =>
              m.sender === 'user' ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2 text-user-msg whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage key={idx} content={m.content} />
              ),
            )}
            {streamingText && <AssistantMessage content={streamingText} />}
            {showActivityIndicator && <ActivityIndicator status={status} activeTool={activeTool} />}
            {showConfirmationCard && onConfirmTool && onCancelTool && (
              <ToolConfirmationCard confirmation={pendingConfirmation} onConfirm={onConfirmTool} onCancel={onCancelTool} />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
