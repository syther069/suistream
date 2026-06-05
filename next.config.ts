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
  },
  async rewrites() {
    return [
      {
        source: "/walrus-proxy/:path*",
        destination: "https://aggregator.walrus.space/:path*"
      }
    ];
  }
};

export default nextConfig;
