// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'SparqHub',
  description: 'Plateforme de chat et gestion d’assistants AI',
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
