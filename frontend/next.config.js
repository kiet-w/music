import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Always standalone for production Docker builds
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
