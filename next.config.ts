import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aggregator.walrus.space",
        pathname: "/v1/**"
      }
    ]
  }
};

export default nextConfig;
