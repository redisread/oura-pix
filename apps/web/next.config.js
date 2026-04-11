const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');

// 开发环境初始化 OpenNext Cloudflare
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

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
      // Mark development dependencies as external to avoid bundling them with the server code
      // These packages are only needed for local development and should not be in production
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        // esbuild is a build tool, not needed at runtime
        config.externals.push('esbuild');
        // Prevent node:sqlite from being bundled - it's not supported in Cloudflare Workers
        // and causes deployment failures. The project uses D1 via Drizzle ORM instead.
        config.externals.push('node:sqlite');
        config.externals.push('sqlite');
      }

      // Optimize bundle size by replacing unnecessary modules with empty stubs
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        // Next.js dev tools are not needed in production
        'next/dist/compiled/next-devtools': false,
        // Edge runtime is not used in this project (using Cloudflare Workers instead)
        // These are kept for compatibility but can be stubbed to reduce size
        // 'next/dist/compiled/@edge-runtime/cookies': false,
      };

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
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development'
              ? 'http://localhost:4001'
              : process.env.NEXT_PUBLIC_APP_URL || 'https://ourapix.jiahongw.com',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },

  // ESLint configuration
  eslint: {
    // 构建时忽略 ESLint 错误
    ignoreDuringBuilds: false,
    // 只检查特定目录，排除 scripts
    dirs: ['app', 'lib', 'components', 'db'],
  },

  // TypeScript configuration
  typescript: {
    // 构建时忽略类型错误（临时解决 scripts 目录的问题）
    ignoreBuildErrors: false,
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
