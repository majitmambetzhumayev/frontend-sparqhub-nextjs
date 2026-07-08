// src/components/LogoutButton.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // logout() already calls POST /api/auth/logout/, clears user/status,
      // and redirects to the login page — it owns the whole flow.
      await logout();
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
