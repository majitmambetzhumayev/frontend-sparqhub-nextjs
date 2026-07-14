// src/components/ProfileMenu.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useLogout } from '@/lib/useLogout';

// Replaces the old standalone LogoutButton at the bottom of the sidebar —
// same position/role, but now shows the user's identity (photo or a
// placeholder user icon, plus their name) and expands on click to reveal
// Settings/Logout, instead of being a single-purpose logout button.
export default function ProfileMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const goToSettings = () => {
    setOpen(false);
    router.push(`/${locale}/settings`);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative px-4 py-3 border-t border-gray-200">
      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={goToSettings}
            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-gray-100"
          >
            {t('settings')}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-gray-100 border-t border-gray-100"
          >
            {t('logout')}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-100 transition-colors"
      >
        <span className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
          {user.profile_picture ? (
            <Image src={user.profile_picture} alt="" fill className="object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-gray-500" />
          )}
        </span>
        <span className="text-sm font-medium text-ink truncate">{user.username}</span>
      </button>
    </div>
  );
}
