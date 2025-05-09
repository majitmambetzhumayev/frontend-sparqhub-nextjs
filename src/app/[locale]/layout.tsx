// src/app/[locale]/layout.tsx
import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

// Extract the literal union type "en" | "fr" from your routing config
type Locale = typeof routing.locales[number]

interface LocaleLayoutProps {
  children: ReactNode
  // Now params.locale is typed as Locale, not string
  params: Promise<{ locale: Locale }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await the params promise per Next.js 15+
  const { locale } = await params

  // TypeScript now knows locale is either "en" or "fr"
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
