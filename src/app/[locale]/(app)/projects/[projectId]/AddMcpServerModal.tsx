// src/app/[locale]/(app)/projects/[projectId]/AddMcpServerModal.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';

export interface AddMcpServerModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (form: { name: string; url: string }) => void;
  onClose: () => void;
}

const emptyForm = { name: '', url: '' };

// sse only — stdio runs a command as a subprocess on the backend itself and
// is restricted to staff server-side (see mcp_client/serializers.py); no
// regular-user flow for it exists, so it's not offered here at all.
const AddMcpServerModal: FC<AddMcpServerModalProps> = ({ isOpen, isSubmitting, error, onSubmit, onClose }) => {
  const t = useTranslations('mcpServers');
  const tCommon = useTranslations('common');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) setForm(emptyForm);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen}>
      <h2 className="text-lg font-semibold mb-4">{t('addServerSubmit')}</h2>

      <div className="space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block mb-1 text-sm font-medium">{t('nameLabel')}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
            placeholder={t('namePlaceholder')}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">{t('urlLabel')}</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
            placeholder="https://example.com/mcp"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
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
          onClick={() => onSubmit(form)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {isSubmitting ? t('adding') : t('addServerSubmit')}
        </button>
      </div>
    </Modal>
  );
};

export default AddMcpServerModal;
