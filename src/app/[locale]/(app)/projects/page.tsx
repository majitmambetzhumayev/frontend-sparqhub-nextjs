// src/app/[locale]/(app)/projects/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project } from '@/types/project';

export default function ProjectsPage() {
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
      if (confirm('Delete this project? Its conversations will move to "No project", not be deleted.')) {
        deleteProject.mutate(id);
      }
    },
    [deleteProject],
  );

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Projects</h1>

      <div className="border rounded p-4 space-y-2">
        <input
          type="text"
          placeholder="Project name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          placeholder="Description (optional)…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={onCreate}
          disabled={!name.trim() || createProject.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          New project
        </button>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && data?.length === 0 && <p className="text-gray-500">No projects yet.</p>}

      <ul className="divide-y border rounded">
        {data?.map((project) => (
          <li key={project.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <Link href={`/projects/${project.id}`} className="flex-1">
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-gray-500">
                {project.thread_count} conversation{project.thread_count === 1 ? '' : 's'}
              </p>
            </Link>
            <button
              onClick={() => onDelete(project.id)}
              className="px-3 py-1 border border-gray-200 text-ink rounded text-sm hover:bg-gray-100"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
