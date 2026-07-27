// src/app/[locale]/page.tsx

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import PublicNavbar from '@/components/PublicNavbar'
import ChangelogMarquee from '@/components/ChangelogMarquee'
import type { ChangelogEntry } from '@/types/changelog'

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
    <main className="min-h-screen flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink">{t('title')}</h1>
        <Link
          href="/dashboard"
          className="mt-10 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 text-sm font-medium"
        >
          {t('cta')}
        </Link>
      </div>
      <div className="pb-12 flex items-center justify-center">
        {changelogEntries.length > 0 ? (
          <ChangelogMarquee entries={changelogEntries} locale={locale} />
        ) : (
          <p className="text-sm text-gray-400">{tChangelog('comingSoon')}</p>
        )}
      </div>
    </main>
  )
}
