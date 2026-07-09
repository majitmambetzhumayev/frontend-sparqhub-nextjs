'use client';

import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('public');
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{t('aboutTitle')}</h1>
    </main>
  );
}
