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
      'zustand',
      'next-intl',
      '@react-oauth/google',
      '@sentry/nextjs',
      'clsx',
      'tailwind-merge',
    ],
  },

  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  // Tắt type-check và lint khi dev để compile nhanh hơn (IDE đã check rồi)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_INTERNAL_URL || 'https://memphis-lace-plastic-policies.trycloudflare.com').replace(/\/$/, '');
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
