/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: output: 'standalone' is not needed for OpenNext Cloudflare
  // OpenNext handles the build output separately

  // Image optimization configuration
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
      },
    ],
  },

  // Internationalization configuration (simplified for local dev)
  // i18n: {
  //   locales: ['en', 'zh'],
  //   defaultLocale: 'zh',
  //   localeDetection: false,
  // },

  // Experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Webpack configuration for Cloudflare Workers compatibility
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'edge') {
      // Handle Cloudflare Workers specific configurations
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          // Disable Node.js specific modules in edge runtime
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        },
      };
    }
    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },

  // Powered by header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // React strict mode
  reactStrictMode: true,

  // Trailing slash configuration
  trailingSlash: false,
};

module.exports = nextConfig;
