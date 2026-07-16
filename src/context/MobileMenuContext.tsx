// src/context/MobileMenuContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';

interface MobileMenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Safety net beyond each nav link's own onClick={close} — also covers
  // navigation that doesn't go through the drawer's own links (e.g.
  // ProfileMenu's Settings/Logout, browser back/forward). Without this,
  // the drawer (or its backdrop) could still be showing on top of
  // whatever page navigation lands on next, since MobileMenuProvider lives
  // at the (app) layout level and persists across route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <MobileMenuContext.Provider value={{ isOpen, toggle: () => setIsOpen((v) => !v), close: () => setIsOpen(false) }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) throw new Error('useMobileMenu must be used within MobileMenuProvider');
  return ctx;
}
