import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ESM-safe project root. `__dirname` is not available in real ES modules
 * (package.json declares `"type": "module"`), so derive it from import.meta.url.
 */
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Manual chunk map. Vite 8 (Rolldown) only accepts the *function* form of
 * `manualChunks`, so the previous object form is expressed as a matcher here.
 * Grouping heavy, cache-stable libraries keeps the main bundle lean and lets
 * returning users reuse cached vendor chunks across app releases.
 */
const VENDOR_CHUNKS: ReadonlyArray<readonly [chunk: string, packages: readonly string[]]> = [
  ['vendor', ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler']],
  ['ui-vendor', ['framer-motion', 'lucide-react', 'recharts', 'sonner']],
  ['export-vendor', ['xlsx', 'pdf-lib', 'jspdf']],
];

const resolveVendorChunk = (id: string): string | undefined => {
  if (!id.includes('node_modules')) return undefined;
  const normalized = id.replace(/\\/g, '/');
  for (const [chunk, packages] of VENDOR_CHUNKS) {
    if (packages.some((pkg) => normalized.includes(`/node_modules/${pkg}/`))) {
      return chunk;
    }
  }
  return undefined;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  return {
    base: './',
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT || 3003),
      strictPort: false,
      host: true,
      cors: true,
      hmr: true,
      /**
       * Host allow-list for the dev server (Vite's DNS-rebinding protection).
       * Only affects `vite dev`; production builds serve static files and are
       * unaffected. Deliberately scoped rather than `allowedHosts: true`, which
       * would disable the protection entirely.
       */
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
    },
    css: {
      postcss: './postcss.config.js',
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
        '@wordpro': path.resolve(rootDir, './src/components/letter-composer'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: resolveVendorChunk,
        },
      },
    },
  };
});
