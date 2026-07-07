// src/lib/useReportError.ts
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function useReportError(error: Error) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);
}
