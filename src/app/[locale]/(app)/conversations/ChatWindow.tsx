// src/app/[locale]/(app)/conversations/ChatWindow.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslations } from 'next-intl';
import ToolConfirmationCard from './ToolConfirmationCard';
import type { PendingConfirmation } from './useConversationSocket';

export interface ChatWindowMessage {
  sender: 'user' | 'assistant';
  content: string;
  toolCalls?: string[];
}

export type ChatActivityStatus = 'idle' | 'connecting' | 'thinking' | 'resuming' | 'tool_call' | 'confirm_required' | 'streaming' | 'error';

export interface ChatWindowProps {
  messages: ChatWindowMessage[];
  streamingText?: string;
  status?: ChatActivityStatus;
  activeTool?: string | null;
  toolTrace?: string[];
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

function ToolTrace({ toolCalls }: { toolCalls: string[] }) {
  const t = useTranslations('conversations');
  if (toolCalls.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {toolCalls.map((tool, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
        >
          {t('usedTool', { tool })}
        </span>
      ))}
    </div>
  );
}

function ActivityIndicator({ status, activeTool }: { status: ChatActivityStatus; activeTool?: string | null }) {
  const t = useTranslations('conversations');
  const label =
    status === 'resuming'
      ? t('resuming')
      : status === 'tool_call'
        ? activeTool === 'generate_image'
          ? t('generatingImage')
          : t('usingTool', { tool: activeTool ?? '' })
        : t('thinking');
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
  toolTrace = [],
  pendingConfirmation,
  onConfirmTool,
  onCancelTool,
}: ChatWindowProps) {
  const t = useTranslations('conversations');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streamingText, status, toolTrace]);

  const showActivityIndicator =
    !streamingText &&
    status !== 'confirm_required' &&
    (status === 'connecting' || status === 'thinking' || status === 'resuming' || status === 'tool_call');
  const showConfirmationCard = status === 'confirm_required' && pendingConfirmation;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !streamingText && toolTrace.length === 0 && !showActivityIndicator && !showConfirmationCard ? (
          <p className="text-gray-500">{t('noMessages')}</p>
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
                <div key={idx} className="space-y-1.5">
                  {m.toolCalls && m.toolCalls.length > 0 && <ToolTrace toolCalls={m.toolCalls} />}
                  <AssistantMessage content={m.content} />
                </div>
              ),
            )}
            {(streamingText || toolTrace.length > 0) && (
              <div className="space-y-1.5">
                {toolTrace.length > 0 && <ToolTrace toolCalls={toolTrace} />}
                {streamingText && <AssistantMessage content={streamingText} />}
              </div>
            )}
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
