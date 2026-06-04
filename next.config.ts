import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aggregator.walrus.space"
      },
      {
        protocol: "https",
        hostname: "aggregator.walrus-testnet.walrus.space"
      }
    ]
  }
};

export default nextConfig;
