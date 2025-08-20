/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: exclude Playwright and other Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'playwright': false,
      }
    } else {
      // Server-side: allow Playwright
      config.externals = config.externals || []
      config.externals.push({
        'playwright': 'commonjs playwright',
      })
    }
    return config
  },
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig 