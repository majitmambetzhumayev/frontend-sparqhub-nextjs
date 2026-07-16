// src/components/CreditsPill.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

export default function CreditsPill() {
  const { user } = useAuth();
  const t = useTranslations('topbar');

  if (!user) return null;

  return (
    <span
      className="text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white text-ink"
      title={t('creditsTitle')}
    >
      {t('credits', { count: user.credits_remaining })}
    </span>
  );
}
