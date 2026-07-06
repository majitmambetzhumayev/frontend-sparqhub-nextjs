// src/app/[locale]/(app)/projects/[projectId]/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project } from '@/types/project';
import type { ThreadListItem } from '@/types/thread';
import McpServersSection from './McpServersSection';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const { data: project } = useQuery<Project, Error>({
    queryKey: ['projects', projectId],
    queryFn: () => api.get<Project>(`/api/projects/${projectId}/`).then((r) => r.data),
  });

  const { data: threads, isLoading } = useQuery<ThreadListItem[], Error>({
    queryKey: ['threads', { project_id: projectId }],
    queryFn: () => api.get<ThreadListItem[]>('/api/threads/', { params: { project_id: projectId } }).then((r) => r.data),
  });

  const updateName = useMutation({
    mutationFn: (name: string) => api.patch<Project>(`/api/projects/${projectId}/`, { name }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/api/projects/${projectId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
  });

  const startEditingName = useCallback(() => {
    setNameDraft(project?.name ?? '');
    setIsEditingName(true);
  }, [project?.name]);

  const saveName = useCallback(() => {
    setIsEditingName(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== project?.name) {
      updateName.mutate(trimmed);
    }
  }, [nameDraft, project?.name, updateName]);

  const onDeleteProject = useCallback(() => {
    if (confirm('Delete this project? Its conversations will move to "No project", not be deleted.')) {
      deleteProject.mutate();
    }
  }, [deleteProject]);

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <Link href="/projects" className="text-sm text-gray-500 hover:text-ink">
        ← Projects
      </Link>

      <div className="flex items-center justify-between">
        {isEditingName ? (
          <input
            type="text"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName();
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            className="text-2xl font-bold border rounded px-2 py-1 flex-1 mr-4"
          />
        ) : (
          <h1
            onClick={startEditingName}
            className="text-2xl font-bold cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2"
            title="Click to rename"
          >
            {project?.name || 'Project'}
          </h1>
        )}
        <button
          onClick={onDeleteProject}
          className="px-3 py-1 border border-gray-200 text-ink rounded text-sm hover:bg-gray-100"
        >
          Delete project
        </button>
      </div>

      {project?.description && <p className="text-gray-500">{project.description}</p>}

      <Link
        href={`/conversations/new?project=${projectId}`}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        New chat in this project
      </Link>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && threads?.length === 0 && <p className="text-gray-500">No conversations in this project yet.</p>}

      <ul className="divide-y border rounded">
        {threads?.map((thread) => (
          <li key={thread.id}>
            <Link href={`/conversations/${thread.id}`} className="block px-4 py-3 hover:bg-gray-50">
              <p className="font-medium truncate">{thread.title || 'New conversation'}</p>
              <p className="text-sm text-gray-500">
                {thread.model} · {new Date(thread.updated_at).toLocaleString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <McpServersSection projectId={projectId} />
    </div>
  );
}
