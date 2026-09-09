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
      // Only ever rendered inside PublicNavbar (forest-900, always dark) --
      // no light-background usage exists to also style for.
      className="px-4 py-2 border border-white/20 text-neutral-100 rounded hover:bg-white/10 transition-colors"
      type="button"
    >
      {t('logout')}
    </button>
  );
}
