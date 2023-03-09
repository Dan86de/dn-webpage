const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
  },
  reactStrictMode: true,
  transpilePackages: ["ui"],
};

module.exports = withContentlayer(nextConfig);
