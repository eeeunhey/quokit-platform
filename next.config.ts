import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // GitHub API 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
      },
    ],
  },
  // 실험적 기능
  experimental: {
    // Server Actions 활성화 (최신 Next.js 버전에서는 기본일 수 있으나 명시)
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
