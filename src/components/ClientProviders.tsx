// src/components/ClientProviders.tsx
'use client';

import React from 'react';
import RootQueryProvider from '@/components/RootQueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // ToastProvider is outermost so RootQueryProvider can show a toast from
  // its global query/mutation error handler (see RootQueryProvider.tsx).
  return (
    <ToastProvider>
      <RootQueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </RootQueryProvider>
    </ToastProvider>
  );
}
