// src/app/[locale]/error.tsx
'use client';

import ErrorFallback from '@/components/ErrorFallback';
import { useReportError } from '@/lib/useReportError';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportError(error);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ErrorFallback onRetry={reset} />
    </div>
  );
}
