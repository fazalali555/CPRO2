import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'path';

/** ESM-safe project root — `__dirname` does not exist in real ES modules. */
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    /**
     * The default 5 s is too tight for this suite: 19 files each build a jsdom
     * environment (~13 s of the run), and on a shared CI runner that contention
     * alone has pushed a synchronous test past the limit. This is headroom for
     * environment spin-up, not for slow assertions — pure-logic tests still
     * complete in milliseconds.
     */
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
});
