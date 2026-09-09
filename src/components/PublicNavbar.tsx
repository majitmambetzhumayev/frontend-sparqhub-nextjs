'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
// Locale-aware Link -- auto-prefixes the current locale onto these bare
// hrefs. Plain next/link here would navigate to unprefixed paths (e.g.
// /dashboard instead of /en/dashboard), triggering an extra
// middleware-driven redirect round-trip on every click.
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import LogoutButton from './LogoutButton';
import LoadingSpinner from './LoadingSpinner';

export default function PublicNavbar() {
  const { user, status } = useAuth();
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);

  // No more nav link list (Home/About/Contact) -- logged out, the only
  // action offered is going straight to login; logged in, dashboard/logout
  // as before.
  const authLinks = user
    ? [
        { href: '/dashboard', key: 'dashboard' },
        { component: <LogoutButton key="logout" /> },
      ]
    : [{ href: '/auth/login', key: 'getStarted' }];

  const closeMenu = () => setIsOpen(false);

  // Only the logged-out "getStarted" CTA gets the pill treatment (light
  // green bg, dark green text) -- the logged-in "dashboard" link stays a
  // plain text link, same as before.
  const linkClass = (key: string) =>
    key === 'getStarted'
      ? 'inline-block px-6 py-2.5 rounded-full bg-forest-100 text-forest-900 text-sm font-semibold hover:bg-white transition-colors'
      : 'text-sm font-medium text-neutral-200 hover:text-white transition-colors';

  return (
    // Always forest-900 (brand color, see globals.css), on every public
    // page -- on the homepage's own forest-900 hero it reads as one
    // continuous block; on the plain white about/contact/auth pages it's
    // just a green bar. No scroll-based color switching needed either way.
    <nav className="bg-forest-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/media/logos/sparqup-dark.svg"
            alt="SparqHub"
            width={28}
            height={28}
            priority
            className="h-7 w-auto"
          />
          {/* font-body (Inter), not font-heading -- matches sparqup's own
              Header.tsx, where the wordmark next to the logo inherits the
              body font rather than the Fraunces heading font. */}
          <span className="font-body text-lg text-neutral-50">SparqHub</span>
        </Link>

        {status === 'loading' ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <ul className="hidden md:flex items-center space-x-6">
              {authLinks.map((item, index) =>
                'component' in item ? (
                  <li key={index}>{item.component}</li>
                ) : (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass(item.key)}>
                      {t(item.key)}
                    </Link>
                  </li>
                )
              )}
              <li>
                <LanguageSwitcher variant="dark" />
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? t('closeMenu') : t('openMenu')}
              className="md:hidden p-2 -mr-2 text-neutral-200 hover:text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        )}
      </div>

      {isOpen && status !== 'loading' && (
        <ul className="md:hidden border-t border-white/10 px-4 py-2 space-y-1">
          {authLinks.map((item, index) =>
            'component' in item ? (
              <li key={index} onClick={closeMenu}>
                {item.component}
              </li>
            ) : (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMenu} className={linkClass(item.key)}>
                  {t(item.key)}
                </Link>
              </li>
            )
          )}
          <li className="py-2">
            <LanguageSwitcher variant="dark" />
          </li>
        </ul>
      )}
    </nav>
  );
}
