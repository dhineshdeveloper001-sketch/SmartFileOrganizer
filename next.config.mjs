/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow SVGs and images if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure large file uploads can pass through route handlers if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
