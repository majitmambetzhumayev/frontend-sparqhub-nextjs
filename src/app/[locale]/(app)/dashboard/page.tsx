// src/app/[locale]/(app)/dashboard/page.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('welcome')}</h1>
    </div>
  );
}
