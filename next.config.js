/** @type {import('next').NextConfig} */
const nextConfig = {
  // OpenNext for Cloudflare 需要 standalone 输出模式
  output: 'standalone',

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
    if (isServer) {
      // Mark wrangler as external to avoid bundling it with the server code
      // wrangler contains Node.js native modules that can't be bundled
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('wrangler');
        // Prevent node:sqlite from being bundled - it's not supported in Cloudflare Workers
        // and causes deployment failures. The project uses D1 via Drizzle ORM instead.
        config.externals.push('node:sqlite');
        config.externals.push('sqlite');
      }

      if (nextRuntime === 'edge') {
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
