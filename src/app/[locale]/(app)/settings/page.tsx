// src/app/[locale]/(app)/settings/page.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import type { APIKey } from '@/types/apikey';
import type { ProvidersResponse } from '@/types/assistant';
import type { AdminUser } from '@/types/adminUser';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({});
  const [isEditingOwnCredits, setIsEditingOwnCredits] = useState(false);
  const [ownCreditsDraft, setOwnCreditsDraft] = useState('');

  const updateOwnCredits = useMutation({
    mutationFn: (credits_remaining: number) =>
      api.patch<AdminUser>(`/api/admin/users/${user?.id}/`, { credits_remaining }).then((r) => r.data),
    onSuccess: () => {
      setIsEditingOwnCredits(false);
      void refreshUser();
    },
  });

  const startEditingOwnCredits = useCallback(() => {
    setOwnCreditsDraft(String(user?.credits_remaining ?? 0));
    setIsEditingOwnCredits(true);
  }, [user?.credits_remaining]);

  const saveOwnCredits = useCallback(() => {
    const parsed = Number(ownCreditsDraft);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    updateOwnCredits.mutate(Math.floor(parsed));
  }, [ownCreditsDraft, updateOwnCredits]);

  const { data: providers } = useQuery<ProvidersResponse, Error>({
    queryKey: ['providers'],
    queryFn: () => api.get<ProvidersResponse>('/api/providers/').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: apiKeys } = useQuery<APIKey[], Error>({
    queryKey: ['apikeys'],
    queryFn: () => api.get<APIKey[]>('/api/apikeys/').then((r) => r.data),
  });

  const saveKey = useMutation({
    mutationFn: (payload: { key_type: string; raw_key: string }) => api.post('/api/apikeys/', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apikeys'] });
      setRawKeys((prev) => ({ ...prev, [variables.key_type]: '' }));
    },
  });

  const deleteKey = useMutation({
    mutationFn: (id: number) => api.delete(`/api/apikeys/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apikeys'] }),
  });

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="border rounded p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-medium">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Shared credits remaining</p>
            <p className="font-medium">{user?.credits_remaining}</p>
          </div>
        </div>
      </section>

      {user?.is_staff && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Admin</h2>
          <div className="border rounded p-4 space-y-3">
            <p className="text-sm text-gray-500">Adjust your own shared-key credit balance.</p>
            {isEditingOwnCredits ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  autoFocus
                  value={ownCreditsDraft}
                  onChange={(e) => setOwnCreditsDraft(e.target.value)}
                  className="w-28 border rounded px-2 py-1"
                />
                <button
                  onClick={saveOwnCredits}
                  disabled={updateOwnCredits.isPending}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingOwnCredits(false)}
                  disabled={updateOwnCredits.isPending}
                  className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.credits_remaining} credits</span>
                <button
                  onClick={startEditingOwnCredits}
                  className="text-sm underline text-gray-500 hover:text-ink"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="text-sm text-gray-500">
          Bring your own API key for a provider to use it instead of the shared default.
        </p>

        <div className="divide-y border rounded">
          {providers &&
            Object.entries(providers).map(([key, info]) => {
              const configured = apiKeys?.find((k) => k.key_type === key);
              return (
                <div key={key} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{info.label}</p>
                    <p className="text-sm text-gray-500">
                      {configured ? 'Configured' : 'Not configured — using shared default key'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder={configured ? '•••• replace key' : 'Enter API key'}
                      value={rawKeys[key] ?? ''}
                      onChange={(e) => setRawKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => saveKey.mutate({ key_type: key, raw_key: rawKeys[key] ?? '' })}
                      disabled={!rawKeys[key]?.trim() || saveKey.isPending}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    {configured && (
                      <button
                        onClick={() => deleteKey.mutate(configured.id)}
                        disabled={deleteKey.isPending}
                        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
