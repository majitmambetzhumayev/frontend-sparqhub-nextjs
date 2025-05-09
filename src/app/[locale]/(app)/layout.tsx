// app/[locale]/(app)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProtectedSidebar from '@/components/ProtectedSidebar'
import ProtectedTopbar from '@/components/ProtectedTopbar'

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
    <div className="flex h-screen">
      <ProtectedSidebar />
      <div className="flex-1 flex flex-col">
        <ProtectedTopbar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}
