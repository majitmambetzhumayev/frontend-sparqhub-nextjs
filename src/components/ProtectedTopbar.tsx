// src/components/ProtectedTopbar.tsx
'use client';

import React from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedTopbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useParams();
  const pathname = usePathname();

  const goToProfile = () => {
    router.push(`/${locale}/settings/profile`);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div>
        {/* Breadcrumb or page title */}
        <h1 className="text-xl font-semibold">
          {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <span className="text-gray-600 hidden sm:inline">
              {user.username}
            </span>
            <button onClick={goToProfile} className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={user.profile_picture ?? '/default-avatar.png'}
                alt="Profile"
                fill
                className="object-cover"
              />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
