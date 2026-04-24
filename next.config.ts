import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // D-02: Enable React's viewTransition integration for View Transitions API.
  // Must be inside `experimental` — top-level viewTransition: true is silently ignored.
  // See: nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition
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
