// src/app/[locale]/(app)/quickchat/page.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface AssistantInfo {
  id: number;
  name: string;
}

interface QuickChatData {
  assistants: AssistantInfo[];
  default_assistant: number | null;
  default_thread: number | null;
}

export default function QuickChatPage() {
  const [assistantId, setAssistantId] = useState<number | ''>('');
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<
    { sender: 'user' | 'assistant'; content: string }[]
  >([]);
  const [input, setInput] = useState('');

  // ——— Fetch quick‐chat metadata ———
  const { data, isLoading } = useQuery<QuickChatData, Error>({
    queryKey: ['quick-chat-data'],
    queryFn: async (): Promise<QuickChatData> => {
      const res = await api.get<QuickChatData>('/api/quick-chat/');
      return res.data;
    },
  });

  // ——— Initialize defaults once data arrives ———
  useEffect(() => {
    if (!data) return;
    setAssistantId(data.default_assistant ?? '');
    setThreadId(data.default_thread);
  }, [data]);

  // ——— When user picks a new assistant ———
  const onAssistantChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const val = Number(e.target.value);
      setAssistantId(val);
      setThreadId(null);
      setMessages([]);
    },
    []
  );

  // ——— Send a message and append responses ———
  const sendMessage = useCallback(async () => {
    if (!assistantId || !input.trim()) return;

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      { sender: 'user', content: input },
    ]);
    const text = input;
    setInput('');

    // Choose correct endpoint
    const endpoint = threadId
      ? `/api/threads/${threadId}/messages/`
      : '/api/threads/messages/';

    try {
      const { data: payload } = await api.post<{
        response: string;
        thread: number;
      }>(endpoint, {
        message: text,
        assistant_id: assistantId,
      });
      setThreadId(payload.thread);
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', content: payload.response },
      ]);
    } catch (err) {
      console.error('Send message error', err);
      // TODO: show user feedback
    }
  }, [assistantId, input, threadId]);

  if (isLoading) {
    return <p>Loading assistants…</p>;
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Quick Chat</h1>

      {/* Assistant Selector */}
      <div>
        <label
          htmlFor="assistant"
          className="block mb-1 font-medium"
        >
          Choose Assistant
        </label>
        <select
          id="assistant"
          value={assistantId}
          onChange={onAssistantChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="" disabled>
            Select one…
          </option>
          {data?.assistants.map((assistant) => (
            <option key={assistant.id} value={assistant.id}>
              {assistant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chat Window */}
      <div className="border rounded p-4 h-96 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                m.sender === 'assistant'
                  ? 'text-gray-800'
                  : 'text-blue-600'
              }`}
            >
              <strong>
                {m.sender === 'assistant' ? 'Assistant:' : 'You:'}
              </strong>{' '}
              {m.content}
            </div>
          ))
        )}
      </div>

      {/* Input & Send */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={!assistantId || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
