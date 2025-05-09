// src/app/[locale]/page.tsx

import { notFound } from 'next/navigation'
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

  return (
    <main className="p-6">
      <PublicNavbar />
      <h1 className="text-3xl font-bold">
        {locale === 'fr' ? 'Bienvenue sur SparqHub' : 'Welcome to SparqHub'}
      </h1>
      <p className="mt-2">
        {locale === 'fr'
          ? 'Commencez en naviguant :'
          : 'Get started by navigating:'}
      </p>

      <div className="mt-4 space-x-4">
        <Link
          href={`/${locale}/dashboard`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {locale === 'fr' ? 'Tableau de bord' : 'Dashboard'}
        </Link>
      </div>
    </main>
  )
}
