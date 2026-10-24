import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // The Predictions page was replaced by Performance Insights
      { source: "/dashboard/predictions", destination: "/dashboard/insights", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/flask/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
