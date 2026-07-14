// src/lib/useLogout.ts
'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Shared by every logout entry point (LogoutButton, ProfileMenu) — used to
// be duplicated in each, both swallowing a failure with only
// console.error and a "// Optionally show a toast" comment.
export function useLogout() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations('nav');

  return async function logoutWithFeedback() {
    try {
      // logout() already calls POST /api/auth/logout/, clears user/status,
      // and redirects to the login page — it owns the whole flow.
      await logout();
    } catch {
      showToast(t('logoutError'));
    }
  };
}
