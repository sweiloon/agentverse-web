/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
  },
  env: {
    // Use empty string for relative URLs in production, fallback to localhost only if undefined
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL !== undefined
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'AgentVerse',
  },
  async rewrites() {
    // Get the backend URL from environment, defaulting to localhost for development
    const backendUrl = process.env.BACKEND_API_URL || 'http://72.60.199.100:8001';

    return [
      {
        // Proxy health check endpoint
        source: '/api/health',
        destination: `${backendUrl}/health`,
      },
      {
        // Proxy all /api/v1/* requests to the backend
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
