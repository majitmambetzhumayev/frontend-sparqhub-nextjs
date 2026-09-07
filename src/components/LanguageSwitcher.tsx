// src/components/LanguageSwitcher.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

// Inline SVGs, not an icon-library dependency -- there are only ever two
// locales (routing.locales), and pulling in a flag-icon package for two
// flags would be the premature dependency. Emoji flags (🇫🇷/🇬🇧) were
// deliberately not used instead: Windows' emoji font renders them as plain
// "FR"/"GB" text, not an actual flag, defeating the point of having one.
function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  );
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <rect width="60" height="30" fill="#00247D" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#CF142B" strokeWidth="2" />
      <path d="M30,0 30,30 M0,15 60,15" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 30,30 M0,15 60,15" stroke="#CF142B" strokeWidth="6" />
    </svg>
  );
}

const LOCALE_META: Record<Locale, { label: string; Flag: typeof FlagFR }> = {
  en: { label: 'English', Flag: FlagGB },
  fr: { label: 'Français', Flag: FlagFR },
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Same click-outside-closes pattern as ProfileMenu, for consistency.
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

  const selectLocale = (loc: Locale) => {
    setOpen(false);
    if (loc !== locale) router.replace(pathname, { locale: loc });
  };

  const Current = LOCALE_META[locale].Flag;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-ink hover:bg-gray-100"
      >
        <Current className="w-5 h-3.5 rounded-[2px] object-cover shrink-0" />
        <span className="uppercase">{locale}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg overflow-hidden"
        >
          {routing.locales.map((loc) => {
            const { label, Flag } = LOCALE_META[loc];
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={loc === locale}
                  onClick={() => selectLocale(loc)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink hover:bg-gray-100"
                >
                  <Flag className="w-5 h-3.5 rounded-[2px] object-cover shrink-0" />
                  <span className="flex-1">{label}</span>
                  {loc === locale && <Check className="w-4 h-4 text-blue-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
