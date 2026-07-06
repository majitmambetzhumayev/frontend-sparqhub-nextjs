// src/app/[locale]/error.tsx
'use client';

import { useEffect } from 'react';
import ErrorFallback from '@/components/ErrorFallback';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ErrorFallback onRetry={reset} />
    </div>
  );
}
