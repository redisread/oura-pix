/** @type {import('knip').KnipConfig} */
module.exports = {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  rules: {
    files: 'off',
    dependencies: 'error',
    unlisted: 'error',
    exports: 'off',
  },
  ignore: [
    '.cleanup-backup/**',
    '**/.wrangler/**',
    '**/.next/**',
    '**/.astro/**',
    '**/.turbo/**',
    'drizzle/**',
    'scripts/**',
    'docs/**',
    '**/*.md',
    '**/*.example',
    'types/**',
    'content/**',
  ],
  ignoreDependencies: [
    'turbo',
    'wrangler',
  ],
  workspaces: {
    'frontend': {
      entry: [
        'src/pages/**/*.astro',
        'src/components/**/*.tsx',
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
        'env.d.ts',
      ],
    },
    'api': {
      entry: [
        'src/index.ts',
        'src/routes/**/*.ts',
        'src/lib/**/*.ts',
        'src/services/**/*.ts',
      ],
    },
    'packages/database': {
      entry: [
        'src/index.ts',
        'src/schema.ts',
        'drizzle.config.ts',
      ],
    },
    'packages/api-client': {
      entry: ['src/index.ts'],
    },
    'packages/types': {
      entry: ['src/index.ts'],
    },
  },
};
