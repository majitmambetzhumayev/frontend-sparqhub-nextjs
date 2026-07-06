// src/app/[locale]/(public)/error.tsx
'use client';

import { useEffect } from 'react';
import ErrorFallback from '@/components/ErrorFallback';

// Sibling to (public)/layout.tsx, so PublicNavbar keeps rendering around
// this fallback — only the page content area is replaced.
export default function PublicError({
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
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ErrorFallback onRetry={reset} />
    </div>
  );
}
