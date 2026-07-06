// app/[locale]/(app)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProtectedSidebar from '@/components/ProtectedSidebar'
import ProtectedTopbar from '@/components/ProtectedTopbar'
import { HeaderContentProvider } from '@/context/HeaderContentContext'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function ProtectedLayout({
  children, params
}: Props) {
  const { locale } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect(`/${locale}/auth/login`)

  return (
    <HeaderContentProvider>
      <div className="flex h-screen overflow-hidden">
        <ProtectedSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <ProtectedTopbar />
          <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">{children}</main>
        </div>
      </div>
    </HeaderContentProvider>
  )
}
