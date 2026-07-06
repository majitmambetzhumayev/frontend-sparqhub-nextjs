// src/app/[locale]/(app)/projects/[projectId]/McpServersSection.tsx
'use client';

import React, { FC, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { MCPServer, MCPServerInput, MCPTransport } from '@/types/mcpServer';

interface McpServersSectionProps {
  projectId: number;
}

const emptyForm = { name: '', transport: 'stdio' as MCPTransport, command: '', args: '', url: '' };

const McpServersSection: FC<McpServersSectionProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const queryKey = ['mcp-servers', { project_id: projectId }];

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: servers, isLoading } = useQuery<MCPServer[], Error>({
    queryKey,
    queryFn: () => api.get<MCPServer[]>('/api/mcp-servers/', { params: { project_id: projectId } }).then((r) => r.data),
  });

  const createServer = useMutation({
    mutationFn: (payload: MCPServerInput) => api.post<MCPServer>('/api/mcp-servers/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
      setForm(emptyForm);
      setError(null);
    },
    onError: () => setError('Could not add this tool server. Check the fields and try again.'),
  });

  const toggleEnabled = useMutation({
    mutationFn: (payload: { id: number; enabled: boolean }) =>
      api.patch<MCPServer>(`/api/mcp-servers/${payload.id}/`, { enabled: payload.enabled }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteServer = useMutation({
    mutationFn: (id: number) => api.delete(`/api/mcp-servers/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const onDelete = useCallback(
    (server: MCPServer) => {
      if (confirm(`Remove "${server.name}"? Conversations in this project will lose access to its tools.`)) {
        deleteServer.mutate(server.id);
      }
    },
    [deleteServer],
  );

  const onSubmit = useCallback(() => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    createServer.mutate({
      project: projectId,
      name: form.name.trim(),
      transport: form.transport,
      command: form.transport === 'stdio' ? form.command.trim() : '',
      args: form.transport === 'stdio' ? form.args.trim().split(/\s+/).filter(Boolean) : [],
      url: form.transport === 'sse' ? form.url.trim() : '',
    });
  }, [form, projectId, createServer]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tool servers (MCP)</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm underline text-gray-500 hover:text-ink"
          >
            + Add server
          </button>
        )}
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!isLoading && servers?.length === 0 && !isAdding && (
        <p className="text-gray-500 text-sm">No tool servers yet. Conversations in this project have no MCP tools.</p>
      )}

      {servers && servers.length > 0 && (
        <ul className="divide-y border rounded">
          {servers.map((server) => (
            <li key={server.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{server.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {server.transport === 'stdio' ? `${server.command} ${server.args.join(' ')}`.trim() : server.url}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={server.enabled}
                    onChange={(e) => toggleEnabled.mutate({ id: server.id, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <button
                  onClick={() => onDelete(server)}
                  className="text-sm underline text-gray-500 hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <div className="border rounded p-4 space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block mb-1 text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Local file tools"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Transport</label>
            <select
              value={form.transport}
              onChange={(e) => setForm((f) => ({ ...f, transport: e.target.value as MCPTransport }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="stdio">STDIO (local command)</option>
              <option value="sse">SSE (remote URL)</option>
            </select>
          </div>
          {form.transport === 'stdio' ? (
            <>
              <div>
                <label className="block mb-1 text-sm font-medium">Command</label>
                <input
                  type="text"
                  value={form.command}
                  onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="python"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Arguments</label>
                <input
                  type="text"
                  value={form.args}
                  onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="-m my_tool_server"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block mb-1 text-sm font-medium">URL</label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="https://example.com/mcp"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setForm(emptyForm);
                setError(null);
              }}
              disabled={createServer.isPending}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={createServer.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {createServer.isPending ? 'Adding…' : 'Add server'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default McpServersSection;
