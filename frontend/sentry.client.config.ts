// sentry.client.config.ts
// This file runs in the browser. It is picked up automatically by Next.js.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of transactions in development, lower in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Disable Sentry debug logging in production
  debug: false,
});
