// src/app/[locale]/(app)/conversations/MoveToProjectModal.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import type { Project } from '@/types/project';

export interface MoveToProjectModalProps {
  isOpen: boolean;
  currentProjectId: number | null;
  isSubmitting: boolean;
  onConfirm: (projectId: number | null) => void;
  onClose: () => void;
}

const MoveToProjectModal: FC<MoveToProjectModalProps> = ({
  isOpen,
  currentProjectId,
  isSubmitting,
  onConfirm,
  onClose,
}) => {
  const t = useTranslations('conversations');
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');
  const [selected, setSelected] = useState<number | null>(currentProjectId);

  useEffect(() => {
    if (isOpen) setSelected(currentProjectId);
  }, [isOpen, currentProjectId]);

  const { data: projects } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects/').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <Modal isOpen={isOpen}>
      <h2 className="text-lg font-semibold mb-4">{t('moveModalTitle')}</h2>

      <label className="block mb-1 font-medium text-sm">{tProjects('projectLabel')}</label>
      <select
        value={selected ?? ''}
        onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
        disabled={isSubmitting}
        className="w-full border rounded px-3 py-2 mb-6"
      >
        <option value="">{tProjects('noProject')}</option>
        {projects?.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

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
          onClick={() => onConfirm(selected)}
          disabled={isSubmitting || selected === currentProjectId}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {isSubmitting ? t('moving') : tCommon('confirm')}
        </button>
      </div>
    </Modal>
  );
};

export default MoveToProjectModal;
