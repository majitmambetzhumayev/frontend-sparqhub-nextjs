import type React from 'react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom doesn't implement scrollIntoView at all — several components
// (e.g. ChatWindow) call it in an effect purely as a UX nicety with no
// return value to assert on, so a no-op stub is enough for tests.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

// Vitest externalizes node_modules deps by default, so vi.mock('next/
// navigation', ...) doesn't intercept next-intl's own internal import of
// it -- next-intl's navigation helpers still try to resolve the real
// module and fail ("Cannot find module .../next/navigation"), since
// Next's own bundler-specific resolution isn't available under Vite.
// Mocking our own @/i18n/navigation wrapper instead sidesteps that
// entirely: it's part of the transformed (not externalized) module graph,
// so vi.mock reliably intercepts it. Affects every component using
// @/i18n/navigation's Link/usePathname/etc. Override usePathname's return
// value with vi.mocked(...) in a specific test when a case needs a
// particular pathname (e.g. active-nav-item highlighting).
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  redirect: vi.fn(),
  getPathname: () => '/',
}));
