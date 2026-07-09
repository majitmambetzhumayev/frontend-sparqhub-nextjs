// src/components/AssistantList.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Assistant } from '@/types/assistant';

export interface AssistantListProps {
  assistants: Assistant[];
  onEdit: (assistant: Assistant) => void;
  onDelete: (assistantId: number) => void;
}

export default function AssistantList({
  assistants,
  onEdit,
  onDelete,
}: AssistantListProps) {
  const t = useTranslations('assistants');
  const tCommon = useTranslations('common');

  if (assistants.length === 0) {
    return <p className="text-gray-600">{t('empty')}</p>;
  }

  return (
    <ul className="space-y-4">
      {assistants.map((assistant) => (
        <li
          key={assistant.id}
          className="flex items-center justify-between p-4 bg-white shadow rounded"
        >
          <span className="font-medium">{assistant.name}</span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => onEdit(assistant)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {tCommon('edit')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(assistant.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {tCommon('delete')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
