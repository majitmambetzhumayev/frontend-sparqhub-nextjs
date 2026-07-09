// src/components/AssistantModal.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Assistant, ProvidersResponse } from '@/types/assistant';

export interface AssistantModalProps {
  isOpen: boolean;
  assistant: Assistant | null;
  isSubmitting: boolean;
  onSubmit: (data: {
    id?: number;
    name: string;
    instructions: string;
    model: string;
    ai_provider: string;
  }) => void;
  onClose: () => void;
}

const AssistantModal: FC<AssistantModalProps> = ({
  isOpen,
  assistant,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const t = useTranslations('assistants');
  const tCommon = useTranslations('common');
  const [name, setName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [aiProvider, setAiProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');

  const { data: providers } = useQuery<ProvidersResponse, Error>({
    queryKey: ['providers'],
    queryFn: () => api.get<ProvidersResponse>('/api/providers/').then((r) => r.data),
    staleTime: 60_000,
  });

  // Keyed only on [assistant, isOpen] — must not reset user-entered text when
  // the `providers` query resolves late (e.g. cold cache, slow connection)
  // after the user already started typing in a "New Assistant" modal.
  useEffect(() => {
    if (!isOpen) return;

    if (assistant) {
      setName(assistant.name);
      setInstructions(assistant.instructions ?? '');
    } else {
      setName('');
      setInstructions('');
    }
  }, [assistant, isOpen]);

  // Separate effect for provider/model defaults, which do depend on
  // `providers` having loaded.
  useEffect(() => {
    if (!isOpen) return;

    if (assistant) {
      setAiProvider(assistant.ai_provider);
      setModel(assistant.model);
      return;
    }

    const firstProvider = providers ? Object.keys(providers)[0] : '';
    setAiProvider(firstProvider);
    setModel(firstProvider ? providers![firstProvider].models[0]?.id ?? '' : '');
  }, [assistant, isOpen, providers]);

  const onProviderChange = (nextProvider: string) => {
    setAiProvider(nextProvider);
    setModel(providers?.[nextProvider]?.models[0]?.id ?? '');
  };

  if (!isOpen) return null;

  const availableModels = providers?.[aiProvider]?.models ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {assistant ? t('editAssistant') : t('newAssistant')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">{t('nameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">{t('instructionsLabel')}</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">{t('providerLabel')}</label>
            <select
              value={aiProvider}
              onChange={(e) => onProviderChange(e.target.value)}
              disabled={isSubmitting || !providers}
              className="w-full border rounded px-3 py-2"
            >
              {providers &&
                Object.entries(providers).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">{t('modelLabel')}</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isSubmitting || availableModels.length === 0}
              className="w-full border rounded px-3 py-2"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit({
                id: assistant?.id,
                name: name.trim(),
                instructions: instructions.trim(),
                model,
                ai_provider: aiProvider,
              })
            }
            disabled={isSubmitting || !name.trim() || !model || !aiProvider}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;
