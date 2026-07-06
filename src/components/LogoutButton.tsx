// src/components/LogoutButton.tsx
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function LogoutButton() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // 1. Invalidate server-side tokens / cookies
      await api.post('/api/auth/logout/');
      // 2. Clear client-side auth state
      await logout();
      // 3. Redirect to localized home or login page
      router.replace(`/${locale}/`);
    } catch (error) {
      console.error('Logout failed', error);
      // Optionally show a toast or error state here
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 border border-gray-200 text-ink rounded hover:bg-gray-100 transition-colors"
      type="button"
    >
      Logout
    </button>
  );
}
