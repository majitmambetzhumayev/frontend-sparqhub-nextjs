// src/app/[locale]/layout.tsx
import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

interface LocaleLayoutProps {
  children: ReactNode
  // Next.js's own generated route types infer `string` for the `[locale]`
  // dynamic segment — narrowing this to the literal locale union here
  // conflicts with that inferred type. hasLocale() below acts as a type
  // guard, narrowing `locale` to the literal union for the rest of this
  // function without needing to narrow the prop type itself.
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await the params promise per Next.js 15+
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Dynamically import the messages for that locale
  const messages = (await import(`@/messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
