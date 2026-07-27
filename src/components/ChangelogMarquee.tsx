// src/components/ChangelogMarquee.tsx
import type { ChangelogEntry } from '@/types/changelog';

interface ChangelogMarqueeProps {
  entries: ChangelogEntry[];
  locale: string;
}

// Pure CSS animation (no client JS needed) -- content is duplicated so the
// -50% translateY keyframe (globals.css) loops seamlessly, and a mask
// gradient fades entries to transparent at both edges as they scroll in/out
// ("les plus anciens se fondent dans le blanc").
export default function ChangelogMarquee({ entries, locale }: ChangelogMarqueeProps) {
  if (entries.length === 0) return null;

  const looped = [...entries, ...entries];
  const maskImage = 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)';

  return (
    <div
      className="h-72 w-full max-w-sm overflow-hidden"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <div className="animate-marquee-vertical flex flex-col gap-6">
        {looped.map((entry, idx) => (
          <div key={`${entry.id}-${idx}`} className="px-4">
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
  );
}
