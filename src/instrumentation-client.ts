import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // No session replay / user feedback widget — this app renders chat
  // conversations, and replay would capture their content on screen. Keep
  // this to crash reporting, same stance as the backend's send_default_pii=False.
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
