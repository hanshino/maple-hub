/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mysql2'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img-api.neople.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'open.api.nexon.com',
      },
    ],
  },
};

export default nextConfig;
