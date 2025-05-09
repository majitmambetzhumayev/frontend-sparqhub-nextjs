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
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
