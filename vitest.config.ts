import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['server/**/*.js'],
      exclude: ['server/index.js', 'server/tests/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 90
      }
    }
  }
});
