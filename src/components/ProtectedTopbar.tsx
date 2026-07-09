// src/components/ProtectedTopbar.tsx
'use client';

import React from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useHeaderContentContext } from '@/context/HeaderContentContext';

// Known top-level route segments get a proper translation; anything else
// (e.g. dynamic sub-paths like /settings/profile) falls back to the
// humanized raw segment, same as before.
const KNOWN_SEGMENTS = ['dashboard', 'conversations', 'projects', 'settings', 'users'] as const;

export default function ProtectedTopbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useParams();
  const pathname = usePathname();
  const { headerContent } = useHeaderContentContext();
  const t = useTranslations('nav');
  const tTopbar = useTranslations('topbar');

  const goToProfile = () => {
    router.push(`/${locale}/settings/profile`);
  };

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
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        {headerContent ?? <h1 className="text-xl font-semibold">{pageTitle}</h1>}
      </div>
      <div className="flex items-center space-x-4 shrink-0">
        {user && (
          <>
            <span
              className="text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white text-ink"
              title={tTopbar('creditsTitle')}
            >
              {tTopbar('credits', { count: user.credits_remaining })}
            </span>
            <span className="text-gray-600 hidden sm:inline">
              {user.username}
            </span>
            <button onClick={goToProfile} className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={user.profile_picture ?? '/default-avatar.png'}
                alt={tTopbar('profileAlt')}
                fill
                className="object-cover"
              />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
