/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: exclude Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'playwright': false,
      }
    } else {
      // Server-side: allow necessary modules
      config.externals = config.externals || []
      config.externals.push({
        'playwright': 'commonjs playwright',
      })
    }
    
    // Tree shaking optimizations
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    }
    
    return config
  },
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Bundle analysis
  bundleAnalyzer: process.env.ANALYZE === 'true',
  // Image optimization
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  // Compression
  compress: true,
  // Performance optimizations
  swcMinify: true,
}

module.exports = nextConfig 