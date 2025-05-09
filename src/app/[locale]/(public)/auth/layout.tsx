// app/[locale]/(public)/auth/layout.tsx

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div>
      <div className="p-4">{children}</div>
    </div>
  )
}