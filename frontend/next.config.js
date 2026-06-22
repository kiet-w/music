import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Always standalone for production Docker builds
  images: {
    unoptimized: true,
  },
};

export default withSentryConfig(
  withNextIntl(nextConfig),
  {
    // Suppress Sentry CLI output during builds
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Upload wider set of source maps for better stack traces
    widenClientFileUpload: true,
    // Hide source maps from the client bundle (don't ship them to browsers)
    hideSourceMaps: true,
    // Tree-shake Sentry logger statements in production
    disableLogger: true,
  },
);
