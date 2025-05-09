// src/components/ProtectedSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Assistant Manager', href: '/assistant-manager' },
  { label: 'Quick Chat', href: '/quickchat' },
  { label: 'Settings', href: '/settings' },
];

export default function ProtectedSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 text-xl font-bold">SparqHub</div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-6 py-3 hover:bg-gray-100 ${
              pathname === item.href ? 'bg-gray-100 font-semibold' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <LogoutButton/>
    </aside>
  );
}
