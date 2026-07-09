import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {withSentryConfig} from '@sentry/nextjs';

// Derived from env vars rather than hardcoded, so this stays correct across
// environments (dev backend on localhost, prod on api.sparqup.fr) without
// needing to be updated by hand alongside them.
function backendConnectSrc(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return '';
  return `${backendUrl} ${backendUrl.replace(/^http/, 'ws')}`;
}

// Sentry can ingest CSP violation reports directly — reusing that instead of
// standing up a dedicated report-collection endpoint. Parsed from the DSN
// rather than hardcoded for the same reason as backendConnectSrc above.
function sentryReportUri(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return '';
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, '');
    return `${url.protocol}//${url.host}/api/${projectId}/security/?sentry_key=${url.username}`;
  } catch {
    return '';
  }
}

function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    // Deliberately strict (no 'unsafe-inline') even though Next.js's App
    // Router injects inline hydration scripts and will very likely violate
    // this — that's the point of Report-Only: find out exactly what a nonce-
    // based policy would need to allow before ever enforcing anything.
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${backendConnectSrc()} ${sentryReportUri() ? new URL(sentryReportUri()).origin : ''}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  const reportUri = sentryReportUri();
  if (reportUri) directives.push(`report-uri ${reportUri}`);
  return directives.join('; ');
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          // This app doesn't use any of these browser features — explicitly
          // denying them is defense-in-depth, not a response to a concrete
          // need today.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Report-Only: observes and reports violations without blocking
          // anything. Enforcing comes in a follow-up once the reports show
          // what a real policy needs to allow.
          { key: 'Content-Security-Policy-Report-Only', value: buildCsp() },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'sparqup',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
});