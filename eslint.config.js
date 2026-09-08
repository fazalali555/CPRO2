import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * Flat config (ESLint 9). The legacy `.eslintrc.json` that used to sit beside
 * this file was dead weight — ESLint 9 ignores it — and it contradicted this one
 * on `no-explicit-any`, so it has been removed.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.eslintrc.cjs',
      '**/*.d.ts',
      'scripts/**',
      'server/**',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // ---- Correctness: errors, CI blocks on them. All currently at zero. ----
      'no-empty': 'error',
      'no-prototype-builtins': 'error',
      'no-case-declarations': 'error',
      'no-useless-escape': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-require-imports': 'error',

      // ---- Backlog: warnings, held by the ratchet in scripts/lint-baseline.mjs.
      // These four still have a large existing footprint (~180 files). They are
      // warnings so the gate is green today, but `npm run lint:baseline` fails CI
      // if any count rises above eslint-baseline.json. Treat new occurrences as
      // build breaks and pay the debt down over time.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
