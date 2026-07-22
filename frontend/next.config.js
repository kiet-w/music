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
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@base-ui/react',
      'sonner',
      'howler',
    ],
  },

  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  // Tắt type-check và lint khi dev để compile nhanh hơn (IDE đã check rồi)
  typescript: {
    ignoreBuildErrors: isDev,
  },
  eslint: {
    ignoreDuringBuilds: isDev,
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_INTERNAL_URL || 'https://inquiry-santa-archive-minute.trycloudflare.com').replace(/\/$/, '');
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
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
