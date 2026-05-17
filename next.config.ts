
/** @type {import('next').NextConfig} */
const isMobile = process.env.EXPORT_MODE === 'true';

const nextConfig = {
  // Only use 'export' when building for Capacitor/Mobile
  output: isMobile ? 'export' : undefined,
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;