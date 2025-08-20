/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config) => {
    config.externals.push({
      'playwright': 'commonjs playwright',
    })
    
    // Handle undici/cheerio compatibility issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
}

module.exports = nextConfig 