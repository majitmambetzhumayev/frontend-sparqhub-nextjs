// src/app/[locale]/(app)/projects/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project } from '@/types/project';

export default function ProjectsPage() {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects/').then((r) => r.data),
  });

  const createProject = useMutation({
    mutationFn: () => api.post<Project>('/api/projects/', { name, description }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setDescription('');
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: number) => api.delete(`/api/projects/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const onCreate = useCallback(() => {
    if (!name.trim()) return;
    createProject.mutate();
  }, [name, createProject]);

  const onDelete = useCallback(
    (id: number) => {
      if (confirm(t('deleteConfirm'))) {
        deleteProject.mutate(id);
      }
    },
    [deleteProject, t],
  );

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="border rounded p-4 space-y-2">
        <input
          type="text"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          placeholder={t('descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={onCreate}
          disabled={!name.trim() || createProject.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('newProject')}
        </button>
      </div>

      {isLoading && <p className="text-gray-500">{tCommon('loading')}</p>}
      {!isLoading && data?.length === 0 && <p className="text-gray-500">{t('empty')}</p>}

      <ul className="divide-y border rounded">
        {data?.map((project) => (
          <li key={project.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <Link href={`/projects/${project.id}`} className="flex-1">
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-gray-500">
                {t('threadCount', { count: project.thread_count })}
              </p>
            </Link>
            <button
              onClick={() => onDelete(project.id)}
              className="px-3 py-1 border border-gray-200 text-ink rounded text-sm hover:bg-gray-100"
            >
              {tCommon('delete')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
