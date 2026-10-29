import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/home.html',
        },
        {
          source: '/admin',
          destination: '/admin-dashboard.html',
        },
        {
          source: '/admin-login',
          destination: '/admin-auth.html',
        },
        {
          source: '/admin/login',
          destination: '/admin-auth.html',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
