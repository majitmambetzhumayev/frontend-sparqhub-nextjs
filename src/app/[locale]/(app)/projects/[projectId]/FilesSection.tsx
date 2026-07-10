// src/app/[locale]/(app)/projects/[projectId]/FilesSection.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

// Placeholder — file upload/storage/thumbnails don't exist yet. Card shell
// only, so the dashboard layout is in place before that feature is built.
export default function FilesSection() {
  const t = useTranslations('projectFiles');

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">{t('title')}</h2>
      <p className="text-gray-500 text-sm">{t('comingSoon')}</p>
    </div>
  );
}
