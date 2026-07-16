'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

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

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-ink">SparqHub</div>

        {status === 'loading' ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <ul className="hidden md:flex items-center space-x-6">
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

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? t('closeMenu') : t('openMenu')}
              className="md:hidden p-2 -mr-2 text-gray-500 hover:text-ink"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        )}
      </div>

      {isOpen && status !== 'loading' && (
        <ul className="md:hidden border-t border-gray-200 px-4 py-2 space-y-1">
          {navLinks.map(({ href, key }) => (
            <li key={href}>
              <Link href={href} onClick={closeMenu} className="block py-2 text-ink hover:text-blue-500">
                {t(key)}
              </Link>
            </li>
          ))}

          {authLinks.map((item, index) =>
            'component' in item ? (
              <li key={index} onClick={closeMenu}>
                {item.component}
              </li>
            ) : (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMenu} className="block py-2 text-ink hover:text-blue-500">
                  {t(item.key)}
                </Link>
              </li>
            )
          )}
        </ul>
      )}
    </nav>
  );
}
