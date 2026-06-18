/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsdom', '@mozilla/readability', 'pdf-parse'],
  },
};

export default nextConfig;
