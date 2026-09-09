// app/[locale]/(app)/loading.tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Next.js's own route-transition loading UI (App Router convention) --
// shown automatically while a page in this segment is being fetched, e.g.
// right after login/register redirects into (app) and the dashboard route
// hasn't finished loading yet. Renders inside (app)/layout.tsx's <main>,
// so the sidebar/topbar chrome stays visible around it.
export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <LoadingSpinner size="large" />
    </div>
  );
}
