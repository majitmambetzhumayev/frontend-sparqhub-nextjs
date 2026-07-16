// src/app/[locale]/page.tsx

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import PublicNavbar from '@/components/PublicNavbar'

interface HomePageProps {
  // params is now a Promise in Next.js 15+
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  // 1) Await the params promise
  const { locale } = await params       // ← must await :contentReference[oaicite:2]{index=2}

  // 2) Validate the locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'home' })

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
    </main>
  )
}
