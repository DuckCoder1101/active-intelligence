import js from '@eslint/js';
import globals from 'globals';

import tseslint from 'typescript-eslint';

import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';

import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'firebase-debug.log',
      '*.config.js',
      '*.config.ts',
      '*.mjs',
      '**/*.js',
      'api/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },

    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'warn',

      'react-refresh/only-export-components': 'off',

      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          'newlines-between': 'always',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
        },
      ],

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],

      eqeqeq: ['error', 'always'],

      curly: ['error', 'all'],

      'prefer-const': 'error',
    },
  },
);
