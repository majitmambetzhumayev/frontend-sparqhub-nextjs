// app/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
})

export function middleware(req: NextRequest) {
  // 1) i18n redirect automatique si pas de locale
  const localeRes = intlMiddleware(req)
  if (localeRes) return localeRes

  return NextResponse.next()
}

export const config = {
  // Excludes anything with a file extension (e.g. /media/logos/x.svg,
  // /favicon.ico), not just the previously hardcoded favicon.ico -- any
  // other static asset under /public hit this middleware too and got a
  // locale prefix redirect it can't actually resolve (confirmed: PublicNavbar's
  // new logo <Image src="/media/logos/...svg"> 307'd to /en/media/logos/...,
  // which isn't a real file). Nothing under /public was referenced by a
  // literal path before, so this was a real but previously unexercised bug.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
