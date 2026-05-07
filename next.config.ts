/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use 'export' when building for Capacitor/Mobile
  output: process.env.IS_CAPACITOR ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;