// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import ClientProviders from '@/components/ClientProviders'

// This layout sits above the [locale] segment and — verified directly, not
// assumed — does not reliably receive the resolved locale via params here,
// so title/description/lang stay a single static default rather than a
// half-working per-locale attempt. (Title and description were previously
// inconsistent: English title, French description — fixed to both English,
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
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
