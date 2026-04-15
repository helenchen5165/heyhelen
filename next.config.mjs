/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['notion.so', 'res.cloudinary.com'],
  },
  // 临时禁用 TypeScript 和 ESLint 检查以加快开发
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: '/helen-resume', destination: '/helen-resume/index.html' },
      { source: '/ppp', destination: '/ppp/index.html' },
    ];
  },
};

export default nextConfig;