// src/app/global-error.tsx
'use client';

// Catches errors thrown by the root layout itself (or anything not already
// caught by a more specific nested error.tsx). Next.js requires this file to
// render its own <html>/<body> since it replaces the root layout entirely —
// it can't rely on globals.css or Tailwind classes being available, so it
// uses inline styles.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            SparqHub hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '8px 16px',
              background: '#1f1f1f',
              color: 'white',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
