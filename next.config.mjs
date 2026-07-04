/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@mozilla/readability', 'pdf-parse'],
  },
};

export default nextConfig;
