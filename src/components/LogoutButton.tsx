// src/components/LogoutButton.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useLogout } from '@/lib/useLogout';

export default function LogoutButton() {
  const t = useTranslations('nav');
  const logout = useLogout();

  return (
    <button
      onClick={logout}
      className="px-4 py-2 border border-gray-200 text-ink rounded hover:bg-gray-100 transition-colors"
      type="button"
    >
      {t('logout')}
    </button>
  );
}
