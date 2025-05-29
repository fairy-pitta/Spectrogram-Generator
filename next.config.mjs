/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Spectrogram-Generator',
  assetPrefix: '/Spectrogram-Generator',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
