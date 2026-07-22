import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../'),
  reactStrictMode: true,

  // Bật export khi build Capacitor APK, standalone khi build Docker production
  ...(process.env.NEXT_STATIC_EXPORT === 'true'
    ? { output: 'export' }
    : isDev
    ? {}
    : { output: 'standalone' }),

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
    ],
  },

  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_INTERNAL_URL ||
      'http://localhost:4000'
    ).replace(/\/$/, '');
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

const finalConfig = withNextIntl(nextConfig);

export default finalConfig;
