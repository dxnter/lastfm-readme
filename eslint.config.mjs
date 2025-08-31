import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginPrettierConfigRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginVitest from '@vitest/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '.releaserc.js',
      'eslint.config.*',
      'vitest.config.*',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  eslintPluginVitest.configs.recommended,
  eslintPluginUnicorn.configs['flat/recommended'],
  eslintPluginPrettierConfigRecommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: ['tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['tsconfig.eslint.json'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'prettier/prettier': 'error',
      'import/no-unresolved': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'vitest/max-nested-describe': [
        'error',
        {
          max: 3,
        },
      ],
      'vitest/consistent-test-it': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-lowercase-title': 'error',
    },
  },
);
