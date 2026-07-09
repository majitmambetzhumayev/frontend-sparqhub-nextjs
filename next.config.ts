import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {withSentryConfig} from '@sentry/nextjs';

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