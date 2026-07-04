import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Chỉ bật standalone trong production (build Docker), không cần trong dev
  ...(isDev ? {} : { output: 'standalone' }),

  images: {
    unoptimized: true,
  },

  // Bật Turbopack để compile nhanh hơn 5-10x trong dev
  ...(isDev && {
    experimental: {
      turbo: {},
    },
  }),

  // Tắt type-check và lint trong dev để không chờ lâu (đã có IDE check)
  typescript: {
    ignoreBuildErrors: isDev,
  },
  eslint: {
    ignoreDuringBuilds: isDev,
  },

  // Tăng giới hạn bộ nhớ webpack
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable poll, dùng native file watching
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
      };
    }
    return config;
  },
};

// Chỉ wrap Sentry trong production để tránh nặng khi dev
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
