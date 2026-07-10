// src/app/[locale]/(app)/projects/CreateProjectModal.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';

export interface CreateProjectModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onCreate: (name: string, description: string) => void;
  onClose: () => void;
}

const CreateProjectModal: FC<CreateProjectModalProps> = ({ isOpen, isSubmitting, onCreate, onClose }) => {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen}>
      <h2 className="text-lg font-semibold mb-4">{t('newProject')}</h2>

      <input
        type="text"
        autoFocus
        placeholder={t('namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSubmitting}
        className="w-full border rounded px-3 py-2 mb-2"
      />
      <textarea
        placeholder={t('descriptionPlaceholder')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isSubmitting}
        className="w-full border rounded px-3 py-2 mb-6"
      />

      <div className="flex justify-end space-x-2">
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
          onClick={() => onCreate(name.trim(), description)}
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {isSubmitting ? tCommon('saving') : t('newProject')}
        </button>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
