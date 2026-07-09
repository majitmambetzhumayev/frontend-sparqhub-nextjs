'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
// Locale-aware Link — auto-prefixes the current locale onto these bare
// hrefs. Plain next/link here would navigate to unprefixed paths (e.g.
// /dashboard instead of /en/dashboard), triggering an extra
// middleware-driven redirect round-trip on every click.
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from './LogoutButton';
import LoadingSpinner from './LoadingSpinner';

export default function PublicNavbar() {
  const { user, status } = useAuth();
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/', key: 'home' },
    { href: '/about', key: 'about' },
    { href: '/contact', key: 'contact' },
  ] as const;

  const authLinks = user
    ? [
        { href: '/dashboard', key: 'dashboard' },
        { component: <LogoutButton key="logout" /> },
      ]
    : [
        { href: '/auth/login', key: 'login' },
        { href: '/auth/register', key: 'register' },
      ];

  return (
    <nav className="bg-white border-b p-4 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-ink">SparqHub</div>

        {status === 'loading' ? (
          <LoadingSpinner size="small" />
        ) : (
          <ul className="flex items-center space-x-6">
            {navLinks.map(({ href, key }) => (
              <li key={href}>
                <Link href={href} className="text-ink hover:text-blue-500">
                  {t(key)}
                </Link>
              </li>
            ))}

            {authLinks.map((item, index) =>
              'component' in item ? (
                <li key={index}>{item.component}</li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className="text-ink hover:text-blue-500">
                    {t(item.key)}
                  </Link>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </nav>
  );
}
