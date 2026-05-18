import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT || 3003),
      strictPort: false,
      host: true,
      cors: true,
      hmr: true,
    },
    css: {
      postcss: './postcss.config.js',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@wordpro': path.resolve(__dirname, './src/features/clerk-desk/wordpro/client/src')
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react', 'recharts', 'sonner'],
            'export-vendor': ['xlsx', 'pdf-lib', 'html2canvas', 'jspdf'],
          },
        },
      },
    },
  };
});
