// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'

// Same brand as the sparqup.fr marketing site: Fraunces (serif) for
// headings, Inter for body text -- see globals.css's --font-heading/
// --font-body, which point at these variables.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// This layout sits above the [locale] segment and -- verified directly, not
// assumed -- does not reliably receive the resolved locale via params here,
// so title/description/lang stay a single static default rather than a
// half-working per-locale attempt. (Title and description were previously
// inconsistent: English title, French description -- fixed to both English,
// matching the app's default locale.)
export const metadata: Metadata = {
  title: 'SparqHub',
  description: 'AI chat and assistant management platform',
}

export default function RootLayout({ children }: {
  children: React.ReactNode
}) {
  // 1) Global providers (React Query, AuthContext…)
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-body">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
