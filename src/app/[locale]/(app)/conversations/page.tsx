// src/app/[locale]/(app)/conversations/page.tsx
'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ThreadListItem } from '@/types/thread';

export default function ConversationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ThreadListItem[], Error>({
    queryKey: ['threads'],
    queryFn: () => api.get<ThreadListItem[]>('/api/threads/').then((r) => r.data),
  });

  const deleteThread = useMutation({
    mutationFn: (id: number) => api.delete(`/api/threads/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['threads'] }),
  });

  const onDelete = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Delete this conversation? This cannot be undone.')) {
        deleteThread.mutate(id);
      }
    },
    [deleteThread],
  );

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <Link
          href="/conversations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New chat
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {!isLoading && data?.length === 0 && (
        <p className="text-gray-500">No conversations yet. Start a new chat.</p>
      )}

      <ul className="divide-y border rounded">
        {data?.map((thread) => (
          <li key={thread.id}>
            <Link
              href={`/conversations/${thread.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{thread.title || 'New conversation'}</p>
                <p className="text-sm text-gray-500">
                  {thread.model} · {new Date(thread.updated_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => onDelete(e, thread.id)}
                className="ml-4 shrink-0 px-3 py-1 border border-gray-200 text-ink rounded text-sm hover:bg-gray-100"
              >
                Delete
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
