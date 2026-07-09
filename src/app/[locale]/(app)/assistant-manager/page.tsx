// src/app/[locale]/(app)/assistant-manager/page.tsx
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Assistant } from '@/types/assistant';
import AssistantList from '@/components/AssistantList';
import AssistantModal from '@/components/AssistantModal';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AssistantManagerPage() {
  const t = useTranslations('assistants');
  const queryClient = useQueryClient();

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<Assistant | null>(null);

  // 1️⃣ Fetch all assistants
  const {
    data: assistants = [],
    isLoading: isFetching,
    isError,
    error,
  } = useQuery<Assistant[], Error>({
    queryKey: ['assistants'],
    queryFn: () => api.get<Assistant[]>('/api/assistants/').then(r => r.data),
    staleTime: 60_000,
  });

  // 2️⃣ Upsert (create/update) mutation
  const {
    mutate: upsert,
    isPending: isUpserting,
  } = useMutation<Assistant, Error, Partial<Assistant>>({
    mutationFn: async (payload) => {
      if (payload.id != null) {
        const res = await api.patch<Assistant>(
          `/api/assistants/${payload.id}/`,
          payload
        );
        return res.data;
      }
      const res = await api.post<Assistant>('/api/assistants/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      closeModal();
    },
  });

  // 3️⃣ Delete mutation
  const { mutate: deleteMutate } = useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/api/assistants/${id}/`).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
    },
  });

  // Handlers
  const openNew = () => {
    setCurrent(null);
    setIsOpen(true);
  };

  const openEdit = (assistant: Assistant) => {
    setCurrent(assistant);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrent(null);
  };

  const handleSubmit = (data: {
    id?: number;
    name: string;
    instructions: string;
    model: string;
    ai_provider: string;
  }) => upsert(data);

  const handleDelete = (id: number) => {
    if (confirm(t('deleteConfirm'))) {
      deleteMutate(id);
    }
  };

  if (isFetching) return <LoadingSpinner />;
  if (isError) return <p className="text-red-600">{t('error', { message: error?.message ?? '' })}</p>;

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          type="button"
          onClick={openNew}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {t('newAssistant')}
        </button>
      </header>

      <AssistantList
        assistants={assistants}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <AssistantModal
        isOpen={isOpen}
        assistant={current}
        isSubmitting={isUpserting}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
