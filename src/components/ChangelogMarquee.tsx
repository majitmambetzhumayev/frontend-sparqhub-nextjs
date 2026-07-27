// src/components/ChangelogMarquee.tsx
'use client';

import { useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ChangelogEntry } from '@/types/changelog';

interface ChangelogMarqueeProps {
  entries: ChangelogEntry[];
  locale: string;
}

const SCROLL_STEP_PX = 120;
const MASK_IMAGE = 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)';

export default function ChangelogMarquee({ entries, locale }: ChangelogMarqueeProps) {
  const t = useTranslations('changelog');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (entries.length === 0) return null;

  const scrollBy = (delta: number) => scrollRef.current?.scrollBy({ top: delta, behavior: 'smooth' });

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('title')}</h2>

      <button
        type="button"
        onClick={() => scrollBy(-SCROLL_STEP_PX)}
        aria-label={t('scrollUp')}
        className="text-gray-400 hover:text-ink"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide h-64 w-full overflow-y-auto"
        style={{ maskImage: MASK_IMAGE, WebkitMaskImage: MASK_IMAGE }}
      >
        <div className="flex flex-col gap-6 pt-6">
          {entries.map((entry) => (
            <div key={entry.id} className="px-4">
              <p className="text-xs text-gray-400">
                {new Date(entry.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-sm font-medium text-ink">
                {locale === 'fr' ? entry.title_fr : entry.title_en}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === 'fr' ? entry.description_fr : entry.description_en}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollBy(SCROLL_STEP_PX)}
        aria-label={t('scrollDown')}
        className="text-gray-400 hover:text-ink"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}
