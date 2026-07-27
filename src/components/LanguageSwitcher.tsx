// src/components/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {routing.locales.map((loc, index) => (
        <span key={loc} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-gray-300" aria-hidden="true">·</span>}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            disabled={loc === locale}
            aria-current={loc === locale}
            className={
              loc === locale
                ? 'font-semibold text-ink cursor-default'
                : 'text-gray-400 hover:text-ink'
            }
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
