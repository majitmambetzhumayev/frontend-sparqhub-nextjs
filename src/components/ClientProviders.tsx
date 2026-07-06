// src/components/ClientProviders.tsx
'use client';

import React from 'react';
import RootQueryProvider from '@/components/RootQueryProvider';
import { AuthProvider } from '@/context/AuthContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <RootQueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RootQueryProvider>
  );
}
