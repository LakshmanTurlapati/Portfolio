import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Local screenshots/tests use 127.0.0.1 because another dev server may own localhost.
  allowedDevOrigins: ['127.0.0.1'],

  // The dev badge overlaps mobile bottom controls while tuning responsive UI.
  devIndicators: false,

  // Standalone output for Docker/Fly.io deployment
  output: 'standalone',

  // Must be inside `experimental` — top-level viewTransition: true is silently ignored.
  experimental: {
    viewTransition: true,
  },

  // Image optimization configuration
  images: {
    // Allow local images from public directory
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
