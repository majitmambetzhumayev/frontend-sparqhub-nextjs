'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from './LogoutButton';
import LoadingSpinner from './LoadingSpinner';

export default function PublicNavbar() {
  const { user, status } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const authLinks = user
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { component: <LogoutButton key="logout" /> },
      ]
    : [
        { href: '/auth/login', label: 'Login' },
        { href: '/auth/register', label: 'Register' },
      ];

  return (
    <nav className="bg-white border-b p-4 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-ink">SparqHub</div>

        {status === 'loading' ? (
          <LoadingSpinner size="small" />
        ) : (
          <ul className="flex items-center space-x-6">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-ink hover:text-blue-500">
                  {label}
                </Link>
              </li>
            ))}

            {authLinks.map((item, index) =>
              item.component ? (
                <li key={index}>{item.component}</li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className="text-ink hover:text-blue-500">
                    {item.label}
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
