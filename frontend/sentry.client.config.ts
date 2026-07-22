// sentry.client.config.ts
// This file runs in the browser. It is picked up automatically by Next.js.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ponytail: was 1.0 in dev — traced 100% of transactions, massive overhead
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,

  // Disable Sentry debug logging in production
  debug: false,
});

