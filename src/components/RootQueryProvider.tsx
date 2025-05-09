// src/components/ClientProviders.tsx
'use client';

import React, { useEffect } from 'react';
import RootQueryProvider from '@/components/RootQueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import api from '@/lib/axios';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // One-time CSRF cookie fetch so that Axios (withCredentials + xsrfCookieName/HeaderName)
  // can automatically include X-CSRFToken on all mutating requests.
  useEffect(() => {
    api.get('/api/csrf/').catch(() => {
      // If it fails (e.g. already fetched), we can safely ignore
    });
  }, []);

  return (
    <RootQueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RootQueryProvider>
  );
}
