/** @type {import('next').NextConfig} */
const nextConfig = {
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
