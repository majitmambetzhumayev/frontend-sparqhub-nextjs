// src/app/[locale]/(app)/conversations/ToolConfirmationCard.tsx
'use client';

import React, { FC } from 'react';
import { useTranslations } from 'next-intl';
import type { PendingConfirmation } from './useConversationSocket';

export interface ToolConfirmationCardProps {
  confirmation: PendingConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatArgLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

const ToolConfirmationCard: FC<ToolConfirmationCardProps> = ({ confirmation, onConfirm, onCancel }) => {
  const t = useTranslations('conversations');
  const tCommon = useTranslations('common');
  const title = confirmation.tool === 'delegate_to_model' ? t('delegateToModel') : confirmation.tool;

  return (
    <div className="border border-gray-200 rounded-lg p-4 max-w-3xl mx-auto space-y-3">
      <p className="text-sm font-semibold text-ink">{t('wantsToUse', { title })}</p>
      <dl className="text-sm space-y-1">
        {Object.entries(confirmation.arguments).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <dt className="text-gray-500 shrink-0">{formatArgLabel(key)}:</dt>
            <dd className="text-ink break-words">{String(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {tCommon('cancel')}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {tCommon('confirm')}
        </button>
      </div>
    </div>
  );
};

export default ToolConfirmationCard;
