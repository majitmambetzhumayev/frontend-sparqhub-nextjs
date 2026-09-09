// app/[locale]/(public)/loading.tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Same Next.js App Router convention as (app)/loading.tsx -- shown while a
// page in this segment (auth pages, etc.) is being fetched. Renders inside
// (public)/layout.tsx's <main>, below the PublicNavbar.
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="large" />
    </div>
  );
}
