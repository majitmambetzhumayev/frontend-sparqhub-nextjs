'use client';

import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('public');
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{t('contactTitle')}</h1>
    </main>
  );
}
