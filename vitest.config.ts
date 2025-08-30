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
      exclude: ['node_modules/', 'dist/', 'coverage/', '**/*.d.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
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
