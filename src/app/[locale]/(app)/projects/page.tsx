// src/app/[locale]/(app)/projects/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project } from '@/types/project';
import CreateProjectModal from './CreateProjectModal';
import ProjectCard from './ProjectCard';

export default function ProjectsPage() {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects/').then((r) => r.data),
  });

  const createProject = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      api.post<Project>('/api/projects/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: number) => api.delete(`/api/projects/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const onCreate = useCallback(
    (name: string, description: string) => {
      if (!name.trim()) return;
      createProject.mutate({ name, description });
    },
    [createProject],
  );

  const onDelete = useCallback(
    (id: number) => {
      if (confirm(t('deleteConfirm'))) {
        deleteProject.mutate(id);
      }
    },
    [deleteProject, t],
  );

  return (
    <div className="p-6 space-y-4 w-[80%] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          {t('newProject')}
        </button>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        isSubmitting={createProject.isPending}
        onCreate={onCreate}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {isLoading && <p className="text-gray-500">{tCommon('loading')}</p>}
      {!isLoading && data?.length === 0 && <p className="text-gray-500">{t('empty')}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((project) => (
          <ProjectCard key={project.id} project={project} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
