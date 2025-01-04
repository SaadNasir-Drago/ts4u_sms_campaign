import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/api/socket/io',
          destination: 'http://localhost:3001/api/socket/io',
        },
      ]
    },
};

export default nextConfig;
