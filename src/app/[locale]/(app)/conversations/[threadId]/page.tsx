// src/app/[locale]/(app)/conversations/[threadId]/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import type { Message, ThreadDetail } from '@/types/thread';
import { useConversationSocket } from '../useConversationSocket';
import ProviderModelPicker from '../ProviderModelPicker';
import MoveToProjectModal from '../MoveToProjectModal';
import ChatWindow from '../ChatWindow';
import { useSetHeaderContent } from '@/context/HeaderContentContext';

export default function ConversationPage() {
  const t = useTranslations('conversations');
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');
  const params = useParams<{ threadId: string }>();
  const threadId = Number(params.threadId);
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const [messages, setMessages] = useState<
    { sender: 'user' | 'assistant'; content: string; toolCalls?: string[]; stopped?: boolean }[]
  >([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const { data: thread } = useQuery<ThreadDetail, Error>({
    queryKey: ['threads', threadId],
    queryFn: () => api.get<ThreadDetail>(`/api/threads/${threadId}/`).then((r) => r.data),
  });

  const { data: history } = useQuery<Message[], Error>({
    queryKey: ['threads', threadId, 'messages'],
    queryFn: () => api.get<Message[]>(`/api/threads/${threadId}/messages/`).then((r) => r.data),
  });

  useEffect(() => {
    if (!history) return;
    setMessages(history.map((m) => ({ sender: m.sender, content: m.content, toolCalls: m.tool_calls })));
  }, [history]);

  // onDone/onError must be stable across renders (useCallback, not inline
  // closures) — they flow into useConversationSocket's ensureSocket, which
  // attachToThread depends on, which the eager-attach effect below depends
  // on. An inline closure gets a new identity every render, which made that
  // effect re-fire (and re-send join_thread) on every single chunk-driven
  // re-render during a live response — a real, observed bug: repeated
  // "resuming" frames fighting the actual streaming status, never settling.
  const onDone = useCallback(
    (fullText: string, _threadId: number, toolCalls: string[], stopped: boolean) => {
      setMessages((prev) => [...prev, { sender: 'assistant', content: fullText, toolCalls, stopped }]);
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      void refreshUser();
    },
    [queryClient, refreshUser],
  );
  const onError = useCallback((message: string) => setError(message), []);
  // Fires only on a genuine (re)join mid-turn (see useConversationSocket's
  // own guard) — re-inserts the user's own message, lost when this page's
  // local `messages` got replaced by another thread's history and then by
  // this thread's own still-stale (turn not yet persisted) history on
  // return. The assistant's answer-so-far doesn't need the same treatment:
  // it lives in streamingText, which the hook already seeds itself.
  const onResumingWithCatchUp = useCallback(
    (userText: string) => setMessages((prev) => [...prev, { sender: 'user', content: userText }]),
    [],
  );

  const {
    sendMessage,
    attachToThread,
    sendConfirmation,
    stopGeneration,
    status,
    streamingText,
    activeTool,
    toolTrace,
    pendingConfirmation,
    delegatingProvider,
  } = useConversationSocket({ threadId, onDone, onError, onResumingWithCatchUp });

  // Connect eagerly (not just lazily on send) so a generation already in
  // flight for this thread — e.g. one that survived a previous dropped
  // connection, or is running from a second tab — is discovered and
  // resumed rather than only becoming visible after a reload.
  useEffect(() => {
    void attachToThread(threadId);
  }, [threadId, attachToThread]);

  const updateProvider = useMutation({
    mutationFn: (payload: { ai_provider: string; model: string }) =>
      api.patch<ThreadDetail>(`/api/threads/${threadId}/`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['threads', threadId] }),
  });

  const onProviderModelChange = useCallback(
    (aiProvider: string, model: string) => updateProvider.mutate({ ai_provider: aiProvider, model }),
    [updateProvider.mutate],
  );

  const updateProject = useMutation({
    mutationFn: (project: number | null) => api.patch<ThreadDetail>(`/api/threads/${threadId}/`, { project }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setMoveError(null);
      setIsMoveModalOpen(false);
    },
    onError: () => setMoveError(t('moveError')),
    // Already shows its own contextual error in the modal — skip the
    // generic global toast to avoid showing two error messages at once.
    meta: { skipGlobalErrorToast: true },
  });

  const updateTitle = useMutation({
    mutationFn: (title: string) => api.patch<ThreadDetail>(`/api/threads/${threadId}/`, { title }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const startEditingTitle = useCallback(() => {
    setTitleDraft(thread?.title ?? '');
    setIsEditingTitle(true);
  }, [thread?.title]);

  const saveTitle = useCallback(() => {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== thread?.title) {
      updateTitle.mutate(trimmed);
    }
  }, [titleDraft, thread?.title, updateTitle.mutate]);

  const onSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input;
    setMessages((prev) => [...prev, { sender: 'user', content: text }]);
    setInput('');
    setError(null);
    await sendMessage(threadId, text);
  }, [input, threadId, sendMessage]);

  const isBusy = status !== 'idle' && status !== 'error';
  // Stop is deliberately unavailable during confirm_required — the
  // confirmation card's own Cancel/Confirm already covers that state, and a
  // real stop there would need a separate cancellation signal distinct from
  // task.cancel() (which confirm_tool_call already catches internally to
  // implement the confirmation timeout, so a plain cancel there would just
  // be swallowed as "declined" rather than actually stopping the turn).
  const canStop = status === 'thinking' || status === 'tool_call' || status === 'streaming' || status === 'resuming';

  const headerContent = useMemo(
    () => (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {thread?.project_name ? (
            <Link href={`/projects/${thread.project}`} className="text-sm text-gray-500 hover:text-ink shrink-0">
              {thread.project_name}
            </Link>
          ) : (
            <span className="text-sm text-gray-500 shrink-0">{tProjects('noProject')}</span>
          )}
          <span className="text-gray-300 shrink-0">/</span>
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="text-lg font-semibold border rounded px-2 py-0.5 flex-1 min-w-0"
            />
          ) : (
            <h1
              onClick={startEditingTitle}
              className="text-lg font-semibold cursor-pointer hover:bg-gray-100 rounded px-2 py-0.5 -mx-2 truncate"
              title={t('clickToRename')}
            >
              {thread?.title || t('fallbackTitle')}
            </h1>
          )}
          <button
            onClick={() => setIsMoveModalOpen(true)}
            className="text-sm underline text-gray-500 hover:text-ink shrink-0"
          >
            {tCommon('edit')}
          </button>
        </div>
        {thread && (
          <ProviderModelPicker
            aiProvider={thread.ai_provider}
            model={thread.model}
            onChange={onProviderModelChange}
            disabled={updateProvider.isPending}
          />
        )}
      </div>
    ),
    [thread, isEditingTitle, titleDraft, saveTitle, startEditingTitle, onProviderModelChange, updateProvider.isPending, t, tProjects, tCommon],
  );

  useSetHeaderContent(headerContent);

  return (
    <div className="flex flex-col h-full">
      <MoveToProjectModal
        isOpen={isMoveModalOpen}
        currentProjectId={thread?.project ?? null}
        isSubmitting={updateProject.isPending}
        error={moveError}
        onConfirm={(project) => updateProject.mutate(project)}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMoveError(null);
        }}
      />

      <ChatWindow
        messages={messages}
        streamingText={streamingText}
        status={status}
        activeTool={activeTool}
        toolTrace={toolTrace}
        pendingConfirmation={pendingConfirmation}
        delegatingProvider={delegatingProvider}
        onConfirmTool={() => sendConfirmation(true)}
        onCancelTool={() => sendConfirmation(false)}
      />

      <div className="shrink-0 border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={t('messagePlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              disabled={isBusy}
              className="flex-1 border rounded px-3 py-2"
            />
            {canStop ? (
              <button
                onClick={() => stopGeneration(threadId)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {t('stop')}
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!input.trim() || isBusy}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {t('send')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
