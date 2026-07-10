// src/app/[locale]/(app)/conversations/new/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useConversationSocket } from '../useConversationSocket';
import ProviderModelPicker from '../ProviderModelPicker';
import ChatWindow, { ChatWindowMessage } from '../ChatWindow';
import { useSetHeaderContent } from '@/context/HeaderContentContext';

export default function NewConversationPage() {
  const t = useTranslations('conversations');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') ? Number(searchParams.get('project')) : undefined;
  const [aiProvider, setAiProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-sonnet-5');
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onDone = useCallback(
    (_fullText: string, threadId: number) => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      void refreshUser();
      router.replace(`/conversations/${threadId}`);
    },
    [queryClient, refreshUser, router],
  );
  const onError = useCallback((message: string) => setError(message), []);

  const {
    sendMessage,
    sendConfirmation,
    status,
    streamingText,
    activeTool,
    toolTrace,
    pendingConfirmation,
    delegatingProvider,
  } = useConversationSocket({ onDone, onError });

  const onProviderModelChange = useCallback((nextProvider: string, nextModel: string) => {
    setAiProvider(nextProvider);
    setModel(nextModel);
  }, []);

  const onSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input;
    setMessages((prev) => [...prev, { sender: 'user', content: text }]);
    setInput('');
    setError(null);
    await sendMessage(null, text, aiProvider, model, projectId);
  }, [input, aiProvider, model, projectId, sendMessage]);

  const isBusy = status !== 'idle' && status !== 'error';

  const headerContent = useMemo(
    () => (
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">{t('newConversationTitle')}</h1>
        <ProviderModelPicker aiProvider={aiProvider} model={model} onChange={onProviderModelChange} disabled={isBusy} />
      </div>
    ),
    [aiProvider, model, onProviderModelChange, isBusy, t],
  );

  useSetHeaderContent(headerContent);

  return (
    <div className="flex flex-col h-full">
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
            <button
              onClick={onSend}
              disabled={!input.trim() || isBusy}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
