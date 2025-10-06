import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' && { output: 'export' }),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
