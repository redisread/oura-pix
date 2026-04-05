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
    'packages/database/**',
  ],
  ignoreDependencies: [
    'turbo',
    'wrangler',
  ],
  workspaces: {
    'apps/web': {
      entry: [
        'src/pages/**/*.astro',
        'src/components/**/*.tsx',
        'src/lib/**/*.ts',
        'env.d.ts',
      ],
    },
    'apps/api': {
      entry: [
        'src/index.ts',
        'src/routes/**/*.ts',
        'src/lib/**/*.ts',
        'src/services/**/*.ts',
      ],
    },
  },
};
