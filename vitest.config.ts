import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'shared/**/*.test.ts',
      'tools/**/*.test.ts',
      'site/data/**/*.test.ts',
      '[0-9][0-9][0-9][0-9]/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'shared/core/**/*.ts',
        'tools/aoc/**/*.ts',
        'tools/quality/**/*.ts',
        'site/data/**/*.ts',
        '[0-9][0-9][0-9][0-9]/**/shared/**/*.ts',
        '[0-9][0-9][0-9][0-9]/**/domain/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        'tools/aoc/cli.ts',
        'tools/aoc/nodeAdapters.ts',
        'tools/quality/generate.ts',
        'tools/quality/tokens.ts',
        'site/data/status/index.ts',
      ],
    },
  },
});
