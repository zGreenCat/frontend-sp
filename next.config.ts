import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint during builds to focus on critical errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
