// src/app/[locale]/(public)/error.tsx
'use client';

import ErrorFallback from '@/components/ErrorFallback';
import { useReportError } from '@/lib/useReportError';

// Sibling to (public)/layout.tsx, so PublicNavbar keeps rendering around
// this fallback — only the page content area is replaced.
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportError(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ErrorFallback onRetry={reset} />
    </div>
  );
}
