// app/[locale]/(public)/layout.tsx
import PublicNavbar from '@/components/PublicNavbar'

export default function PublicLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <div>
      <PublicNavbar />
      <main>{children}</main>
    </div>
  )
}