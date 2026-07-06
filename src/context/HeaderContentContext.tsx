// src/context/HeaderContentContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface HeaderContentContextType {
  headerContent: React.ReactNode | null;
  setHeaderContent: (node: React.ReactNode | null) => void;
}

const HeaderContentContext = createContext<HeaderContentContextType | undefined>(undefined);

export function HeaderContentProvider({ children }: { children: React.ReactNode }) {
  const [headerContent, setHeaderContent] = useState<React.ReactNode | null>(null);

  return (
    <HeaderContentContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContentContext.Provider>
  );
}

export function useHeaderContentContext() {
  const ctx = useContext(HeaderContentContext);
  if (!ctx) throw new Error('useHeaderContentContext must be within HeaderContentProvider');
  return ctx;
}

// Pages call this to render custom content (breadcrumb, provider picker, ...)
// in the sticky topbar instead of the generic pathname-derived title. Content
// is cleared automatically when the calling page unmounts.
export function useSetHeaderContent(node: React.ReactNode | null) {
  const { setHeaderContent } = useHeaderContentContext();

  useEffect(() => {
    setHeaderContent(node);
    return () => setHeaderContent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);
}
