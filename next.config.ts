import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for AWS Amplify SSR deployment
  output: 'standalone',
};

export default nextConfig;
