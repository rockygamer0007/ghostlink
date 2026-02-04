/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore typescript errors
    ignoreBuildErrors: true,
  },
  // Ensure we don't have strict reaction to missing peer dependencies
  reactStrictMode: false,
};

module.exports = nextConfig;