import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      { hostname: "**.supabase.co" },
      { hostname: "graph.facebook.com" },
      { hostname: "platform-lookaside.fbsbx.com" },
      { hostname: "scontent.xx.fbcdn.net" },
      { hostname: "scontent.*.fbcdn.net" },
      { hostname: "platform.facebook.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "*.googleusercontent.com" },
    ],
  },
  experimental: {
    cacheComponents: true,
  },
};

export default nextConfig;
