// src/app/[locale]/page.tsx

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { MessagesSquare, Wrench, Brain } from 'lucide-react'
import { routing } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import PublicNavbar from '@/components/PublicNavbar'
import ChangelogMarquee from '@/components/ChangelogMarquee'
import type { ChangelogEntry } from '@/types/changelog'

// Order matches messages/*.json's home.features keys -- one icon per
// theme (each card groups related shipped features, not a 1:1 feature
// list), picked for what it actually does rather than decoration.
const FEATURE_ICONS = {
  chat: MessagesSquare,
  agents: Wrench,
  context: Brain,
} as const

interface HomePageProps {
  // params is now a Promise in Next.js 15+
  params: Promise<{ locale: string }>
}

async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    // Patch notes change rarely (only when someone adds one via admin) --
    // revalidated hourly rather than refetched on every single page load.
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/changelog/`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    // The landing page must render even if the backend is briefly
    // unreachable -- an empty list just falls back to the "coming soon" text.
    return []
  }
}

export default async function HomePage({ params }: HomePageProps) {
  // 1) Await the params promise
  const { locale } = await params       // ← must await :contentReference[oaicite:2]{index=2}

  // 2) Validate the locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'home' })
  const tChangelog = await getTranslations({ locale, namespace: 'changelog' })
  const changelogEntries = await getChangelogEntries()

  return (
    <main className="flex flex-col">
      <PublicNavbar />

      {/* Dark hero — same forest-900 as PublicNavbar itself (sticky,
          in-flow, always solid), so the two read as one continuous block
          instead of needing a scroll-triggered color match. */}
      <div className="bg-forest-900 px-6 pt-16 pb-24 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-neutral-50">
          {t('title')}
        </h1>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          {(Object.keys(FEATURE_ICONS) as Array<keyof typeof FEATURE_ICONS>).map((key) => {
            const Icon = FEATURE_ICONS[key]
            return (
              <div key={key} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <Icon className="w-5 h-5 text-forest-400" />
                <p className="mt-3 font-semibold text-neutral-50">{t(`features.${key}.title`)}</p>
                <p className="mt-1 text-sm text-neutral-300">{t(`features.${key}.description`)}</p>
              </div>
            )
          })}
        </div>

        <Link
          href="/dashboard"
          className="mt-10 inline-block px-6 py-3 bg-forest-100 text-neutral-900 rounded-full hover:bg-white transition-colors text-sm font-medium"
        >
          {t('cta')}
        </Link>
      </div>

      {/* Light section below the hero — ChangelogMarquee's own colors
          (text-ink/gray-*) assume a light background. */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center px-6 py-16 bg-white">
        {changelogEntries.length > 0 ? (
          <ChangelogMarquee entries={changelogEntries} locale={locale} />
        ) : (
          <p className="text-sm text-gray-400">{tChangelog('comingSoon')}</p>
        )}
      </div>
    </main>
  )
}
