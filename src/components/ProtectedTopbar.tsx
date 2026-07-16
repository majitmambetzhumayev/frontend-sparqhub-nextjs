// src/components/ProtectedTopbar.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHeaderContentContext } from '@/context/HeaderContentContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import CreditsPill from './CreditsPill';

// Known top-level route segments get a proper translation; anything else
// (e.g. dynamic sub-paths like /settings/profile) falls back to the
// humanized raw segment, same as before.
const KNOWN_SEGMENTS = ['dashboard', 'conversations', 'projects', 'settings', 'users'] as const;

export default function ProtectedTopbar() {
  const pathname = usePathname();
  const { headerContent } = useHeaderContentContext();
  const { toggle } = useMobileMenu();
  const t = useTranslations('nav');

  const pageTitle = (() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    // dynamic routes (e.g. /conversations/42) end in a raw id — fall
    // back to the parent segment instead of showing the number
    const label = last && /^\d+$/.test(last) ? segments[segments.length - 2] : last;
    if (label && (KNOWN_SEGMENTS as readonly string[]).includes(label)) {
      return t(label as (typeof KNOWN_SEGMENTS)[number]);
    }
    return label?.replace(/-/g, ' ') || t('dashboard');
  })();

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('openMenu')}
        className="md:hidden shrink-0 p-2 -ml-2 text-gray-500 hover:text-ink"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">
        {headerContent ?? <h1 className="text-xl font-semibold truncate">{pageTitle}</h1>}
      </div>
      {/* On mobile, credits live inside the drawer (ProtectedSidebar)
          alongside the rest of the sidebar/topbar's static content. */}
      <div className="hidden md:flex items-center space-x-4 shrink-0">
        <CreditsPill />
      </div>
    </header>
  );
}
