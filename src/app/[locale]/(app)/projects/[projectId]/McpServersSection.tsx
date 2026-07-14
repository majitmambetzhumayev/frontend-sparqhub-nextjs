// src/app/[locale]/(app)/projects/[projectId]/McpServersSection.tsx
'use client';

import React, { FC, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { CardMenu, CardMenuItem } from '@/components/CardMenu';
import { useToast } from '@/context/ToastContext';
import type { MCPServer, MCPServerInput } from '@/types/mcpServer';
import AddMcpServerModal from './AddMcpServerModal';

interface McpServersSectionProps {
  projectId: number;
}

const McpServersSection: FC<McpServersSectionProps> = ({ projectId }) => {
  const t = useTranslations('mcpServers');
  const tCommon = useTranslations('common');
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['mcp-servers', { project_id: projectId }];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: servers, isLoading } = useQuery<MCPServer[], Error>({
    queryKey,
    queryFn: () => api.get<MCPServer[]>('/api/mcp-servers/', { params: { project_id: projectId } }).then((r) => r.data),
  });

  const createServer = useMutation({
    mutationFn: (payload: MCPServerInput) => api.post<MCPServer>('/api/mcp-servers/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAddModalOpen(false);
      setError(null);
    },
    onError: () => setError(t('addError')),
    // Already shows its own contextual error in the modal — skip the
    // generic global toast to avoid showing two error messages at once.
    meta: { skipGlobalErrorToast: true },
  });

  const toggleEnabled = useMutation({
    mutationFn: (payload: { id: number; enabled: boolean }) =>
      api.patch<MCPServer>(`/api/mcp-servers/${payload.id}/`, { enabled: payload.enabled }).then((r) => r.data),
    onSuccess: (updatedServer) => {
      queryClient.invalidateQueries({ queryKey });
      showToast(
        t('toggledToast', { name: updatedServer.name, status: updatedServer.enabled ? t('enabled') : t('disabled') }),
      );
    },
  });

  const deleteServer = useMutation({
    mutationFn: (id: number) => api.delete(`/api/mcp-servers/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const onDelete = useCallback(
    (server: MCPServer) => {
      if (confirm(t('removeConfirm', { name: server.name }))) {
        deleteServer.mutate(server.id);
      }
    },
    [deleteServer, t],
  );

  const onSubmit = useCallback(
    (form: { name: string; url: string }) => {
      if (!form.name.trim()) {
        setError(t('nameRequired'));
        return;
      }
      createServer.mutate({
        project: projectId,
        name: form.name.trim(),
        transport: 'sse',
        command: '',
        args: [],
        url: form.url.trim(),
      });
    },
    [projectId, createServer, t],
  );

  // Enabled first — those are the ones actually in effect for this
  // project's conversations, so they're what you want to see at a glance.
  const sortedServers = servers ? [...servers].sort((a, b) => Number(b.enabled) - Number(a.enabled)) : [];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="text-sm underline text-gray-500 hover:text-ink"
        >
          {t('addServerToggle')}
        </button>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">{tCommon('loading')}</p>}
      {!isLoading && sortedServers.length === 0 && <p className="text-gray-500 text-sm">{t('empty')}</p>}

      <div className="space-y-2">
        {sortedServers.map((server) => (
          <div
            key={server.id}
            className={`relative flex items-center gap-2 border rounded p-3 ${
              server.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={server.enabled}
              onChange={(e) => toggleEnabled.mutate({ id: server.id, enabled: e.target.checked })}
              className="shrink-0"
            />
            <p className="font-medium text-sm truncate flex-1">{server.name}</p>
            <CardMenu>
              <CardMenuItem onClick={() => onDelete(server)}>{tCommon('remove')}</CardMenuItem>
            </CardMenu>
          </div>
        ))}
      </div>

      <AddMcpServerModal
        isOpen={isAddModalOpen}
        isSubmitting={createServer.isPending}
        error={error}
        onSubmit={onSubmit}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
      />
    </div>
  );
};

export default McpServersSection;
