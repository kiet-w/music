import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Chỉ bật standalone trong production (build Docker)
  ...(isDev ? {} : { output: 'standalone' }),

  images: {
    unoptimized: true,
  },

  // Tắt type-check và lint khi dev để compile nhanh hơn (IDE đã check rồi)
  typescript: {
    ignoreBuildErrors: isDev,
  },
  eslint: {
    ignoreDuringBuilds: isDev,
  },
};

// Chỉ wrap Sentry trong production để tránh overhead khi dev
const finalConfig = isDev
  ? withNextIntl(nextConfig)
  : withSentryConfig(
      withNextIntl(nextConfig),
      {
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
      {
        widenClientFileUpload: true,
        hideSourceMaps: true,
        disableLogger: true,
      },
    );

export default finalConfig;
