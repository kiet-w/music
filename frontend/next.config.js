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
  trailingSlash: true,
  compress: true,

  // Bật standalone trong production (build Docker)
  ...(isDev ? {} : { output: 'standalone' }),

  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@geist/font',
      'geist',
    ],
    // Optimize CSS
    optimizeCss: true,
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

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
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
