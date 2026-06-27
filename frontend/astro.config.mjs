import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      paraglideVitePlugin({
        project: '../packages/i18n/project.inlang',
        outdir: './src/paraglide',
        strategy: ['url', 'cookie', 'baseLocale'],
        routeStrategies: [
          { match: '/api/:path(.*)?', exclude: true },
          { match: '/_astro/:path(.*)?', exclude: true },
          { match: '/favicon.svg', exclude: true },
        ],
        emitTsDeclarations: true,
        isServer: 'import.meta.env.SSR',
      }),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});
