// src/components/ErrorFallback.tsx
'use client';

import { useTranslations } from 'next-intl';

interface ErrorFallbackProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  const t = useTranslations('errors');

  return (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-gray-500 mb-4">
        {message ?? t('defaultMessage')}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
