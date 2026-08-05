import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  allowedDevOrigins: ['3000-8431937e2544851e.monkeycode-ai.online', '*.monkeycode-ai.online', '.monkeycode-ai.online'],
};

export default nextConfig;
