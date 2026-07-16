// src/components/ProtectedSidebar.tsx
'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useMobileMenu } from '@/context/MobileMenuContext';
import CreditsPill from './CreditsPill';
import ProfileMenu from './ProfileMenu';

const navItems = [
  { key: 'dashboard', href: '/dashboard' },
  { key: 'conversations', href: '/conversations' },
  { key: 'projects', href: '/projects' },
] as const;

const adminNavItems = [
  { key: 'users', href: '/users' },
] as const;

type NavItem = { key: string; href: string };

interface SidebarContentProps {
  items: readonly NavItem[];
  pathname: string;
  t: ReturnType<typeof useTranslations<'nav'>>;
  // Mobile-only extras: closing the drawer on tap, and surfacing credits
  // (shown separately in the desktop topbar instead — see ProtectedTopbar).
  onNavigate?: () => void;
  showCredits?: boolean;
}

function SidebarContent({ items, pathname, t, onNavigate, showCredits }: SidebarContentProps) {
  return (
    <>
      <div className="p-6 text-xl font-bold">SparqHub</div>
      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block px-6 py-3 hover:bg-gray-100 ${
              pathname === item.href ? 'bg-gray-100 font-semibold' : ''
            }`}
          >
            {t(item.key as 'dashboard' | 'conversations' | 'projects' | 'users')}
          </Link>
        ))}
      </nav>
      {showCredits && (
        <div className="px-6 py-3 border-t border-gray-200">
          <CreditsPill />
        </div>
      )}
      <ProfileMenu />
    </>
  );
}

export default function ProtectedSidebar() {
  // Locale-aware pathname (no /en, /fr prefix) so it actually matches
  // item.href — plain next/navigation's usePathname() never did, since
  // its value always carries the locale prefix.
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('nav');
  const { isOpen, close } = useMobileMenu();

  const items = user?.is_staff ? [...navItems, ...adminNavItems] : navItems;

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-full bg-white border-r border-gray-200 flex-col overflow-y-auto">
        <SidebarContent items={items} pathname={pathname} t={t} />
      </aside>

      {/* Mobile: drawer, only in the DOM while open */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label={t('closeMenu')}
            className="absolute inset-0 bg-black/30"
            onClick={close}
          />
          <aside className="relative w-64 max-w-[80%] h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
            <button
              type="button"
              onClick={close}
              aria-label={t('closeMenu')}
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent items={items} pathname={pathname} t={t} onNavigate={close} showCredits />
          </aside>
        </div>
      )}
    </>
  );
}
