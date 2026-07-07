// src/app/[locale]/(app)/error.tsx
'use client';

import ErrorFallback from '@/components/ErrorFallback';
import { useReportError } from '@/lib/useReportError';

// Sibling to (app)/layout.tsx, so the sidebar/topbar keep rendering around
// this fallback — only the page content area is replaced.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportError(error);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <ErrorFallback
        message="This page ran into an error. Try again, or pick something else from the sidebar."
        onRetry={reset}
      />
    </div>
  );
}
