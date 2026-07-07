import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {withSentryConfig} from '@sentry/nextjs';

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'sparqup',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
});