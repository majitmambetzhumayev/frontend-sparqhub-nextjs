// src/components/ProtectedSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import ProfileMenu from './ProfileMenu';

const navItems = [
  { key: 'dashboard', href: '/dashboard' },
  { key: 'conversations', href: '/conversations' },
  { key: 'projects', href: '/projects' },
] as const;

const adminNavItems = [
  { key: 'users', href: '/users' },
] as const;

export default function ProtectedSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('nav');

  const items = user?.is_staff ? [...navItems, ...adminNavItems] : navItems;

  return (
    <aside className="w-64 shrink-0 h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-6 text-xl font-bold">SparqHub</div>
      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-6 py-3 hover:bg-gray-100 ${
              pathname === item.href ? 'bg-gray-100 font-semibold' : ''
            }`}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <ProfileMenu/>
    </aside>
  );
}
