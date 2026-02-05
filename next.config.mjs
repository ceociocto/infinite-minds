/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  },
};

export default nextConfig;
