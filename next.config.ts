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
          destination: '/index.html',
        },
        {
          source: '/admin',
          destination: '/admin.html',
        },
        {
          source: '/admin-login',
          destination: '/admin-login.html',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
