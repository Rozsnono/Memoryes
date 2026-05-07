/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use 'export' when building for Capacitor/Mobile
  output: process.env.EXPORT_MODE === 'true' ? 'export' : undefined,
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
};

export default nextConfig;