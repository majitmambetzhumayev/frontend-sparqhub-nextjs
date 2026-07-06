// src/app/[locale]/(app)/users/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import type { AdminUser } from '@/types/adminUser';

export default function UsersAdminPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creditsDraft, setCreditsDraft] = useState('');

  const { data: users, isLoading } = useQuery<AdminUser[], Error>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUser[]>('/api/admin/users/').then((r) => r.data),
    enabled: !!user?.is_staff,
  });

  const updateCredits = useMutation({
    mutationFn: (payload: { id: number; credits_remaining: number }) =>
      api.patch<AdminUser>(`/api/admin/users/${payload.id}/`, { credits_remaining: payload.credits_remaining }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: (payload: { id: number; is_active: boolean }) =>
      api.patch<AdminUser>(`/api/admin/users/${payload.id}/`, { is_active: payload.is_active }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const startEditing = useCallback((u: AdminUser) => {
    setEditingId(u.id);
    setCreditsDraft(String(u.credits_remaining));
  }, []);

  const saveCredits = useCallback(
    (id: number) => {
      const parsed = Number(creditsDraft);
      if (!Number.isFinite(parsed) || parsed < 0) return;
      updateCredits.mutate({ id, credits_remaining: Math.floor(parsed) });
    },
    [creditsDraft, updateCredits],
  );

  // Redirecting must happen in an effect, not during render — calling
  // router.replace() directly in the component body updates router state
  // while React is still mid-render, which React's render-purity rules warn
  // against and can cause the navigation to be dropped on that pass.
  useEffect(() => {
    if (status === 'authenticated' && !user?.is_staff) {
      router.replace('/dashboard');
    }
  }, [status, user, router]);

  if (status === 'loading' || (status === 'authenticated' && !user)) {
    return <p className="p-6 text-gray-500">Loading…</p>;
  }

  if (!user?.is_staff) {
    return null;
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-sm text-gray-500">Manage user accounts and shared-key credit balances.</p>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {users && (
        <table className="w-full border rounded text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium">Username</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Credits</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  {u.username}
                  {u.is_staff && <span className="ml-2 text-xs text-gray-500">(admin)</span>}
                </td>
                <td className="p-3 text-gray-500">{u.email || '—'}</td>
                <td className="p-3">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={creditsDraft}
                        onChange={(e) => setCreditsDraft(e.target.value)}
                        className="w-24 border rounded px-2 py-1"
                      />
                      <button
                        onClick={() => saveCredits(u.id)}
                        disabled={updateCredits.isPending}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={updateCredits.isPending}
                        className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{u.credits_remaining}</span>
                      <button
                        onClick={() => startEditing(u)}
                        className="text-xs underline text-gray-500 hover:text-ink"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={u.is_active}
                      onChange={(e) => toggleActive.mutate({ id: u.id, is_active: e.target.checked })}
                    />
                    <span className="text-gray-500">{u.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                </td>
                <td className="p-3 text-gray-500">{new Date(u.date_joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
