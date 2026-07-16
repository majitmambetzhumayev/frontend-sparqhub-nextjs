// src/app/[locale]/(app)/dashboard/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import type { ThreadListItem } from '@/types/thread';
import type { Project } from '@/types/project';
import type { UsageSummary } from '@/types/usage';

const RECENT_CONVERSATIONS_LIMIT = 5;
const RECENT_PROJECTS_LIMIT = 4;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tConversations = useTranslations('conversations');
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');
  const { user } = useAuth();

  const { data: threads, isLoading: threadsLoading } = useQuery<ThreadListItem[], Error>({
    queryKey: ['threads'],
    queryFn: () => api.get<ThreadListItem[]>('/api/threads/').then((r) => r.data),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects/').then((r) => r.data),
  });

  const { data: usage } = useQuery<UsageSummary, Error>({
    queryKey: ['usage-summary'],
    queryFn: () => api.get<UsageSummary>('/api/usage/summary/').then((r) => r.data),
  });

  // Already sorted -updated_at by the backend — just take the first few.
  const recentThreads = threads?.slice(0, RECENT_CONVERSATIONS_LIMIT) ?? [];
  const recentProjects = projects?.slice(0, RECENT_PROJECTS_LIMIT) ?? [];

  return (
    <div className="p-6 space-y-6 w-[90%] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('welcome', { username: user?.username ?? '' })}</h1>
        <div className="flex gap-2">
          <Link
            href="/conversations/new"
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            {t('newConversation')}
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 border border-gray-200 text-ink rounded hover:bg-gray-100"
          >
            {t('newProject')}
          </Link>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 flex gap-10">
        <div>
          <p className="text-sm text-gray-500">{t('inputTokens')}</p>
          <p className="text-2xl font-semibold">{(usage?.input_tokens ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t('outputTokens')}</p>
          <p className="text-2xl font-semibold">{(usage?.output_tokens ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('recentConversations')}</h2>
            <Link href="/conversations" className="text-sm underline text-gray-500 hover:text-ink">
              {t('viewAll')}
            </Link>
          </div>

          {threadsLoading && <p className="text-gray-500 text-sm">{tCommon('loading')}</p>}
          {!threadsLoading && recentThreads.length === 0 && (
            <p className="text-gray-500 text-sm">{tConversations('empty')}</p>
          )}

          <ul className="divide-y border rounded">
            {recentThreads.map((thread) => (
              <li key={thread.id}>
                <Link href={`/conversations/${thread.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <p className="font-medium truncate">{thread.title || tConversations('untitled')}</p>
                  <p className="text-sm text-gray-500">
                    {thread.model} · {new Date(thread.updated_at).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('yourProjects')}</h2>
            <Link href="/projects" className="text-sm underline text-gray-500 hover:text-ink">
              {t('viewAll')}
            </Link>
          </div>

          {projectsLoading && <p className="text-gray-500 text-sm">{tCommon('loading')}</p>}
          {!projectsLoading && recentProjects.length === 0 && (
            <p className="text-gray-500 text-sm">{tProjects('empty')}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <p className="font-medium truncate">{project.name}</p>
                {project.description && (
                  <p className="text-sm text-gray-500 truncate mt-1">{project.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {tProjects('threadCount', { count: project.thread_count })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
