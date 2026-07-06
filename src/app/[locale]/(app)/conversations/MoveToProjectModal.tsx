// src/app/[locale]/(app)/conversations/MoveToProjectModal.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
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
  const [selected, setSelected] = useState<number | null>(currentProjectId);

  useEffect(() => {
    if (isOpen) setSelected(currentProjectId);
  }, [isOpen, currentProjectId]);

  const { data: projects } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects/').then((r) => r.data),
    staleTime: 60_000,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Move conversation</h2>

        <label className="block mb-1 font-medium text-sm">Project</label>
        <select
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
          disabled={isSubmitting}
          className="w-full border rounded px-3 py-2 mb-6"
        >
          <option value="">No project</option>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={isSubmitting || selected === currentProjectId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Moving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveToProjectModal;
