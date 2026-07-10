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
  return (
    <RootQueryProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </RootQueryProvider>
  );
}
