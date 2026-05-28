import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // Removed for now to avoid middleware conflicts in dev/standard prod
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
