/// <reference types="vitest" />

import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportOnFailure: true,
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '.releaserc.js',
        'eslint.config.mjs',
        'vitest.config.ts',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    reporters: ['default', 'github-actions'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
