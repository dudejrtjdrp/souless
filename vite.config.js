import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcRootPath = path.join(__dirname, 'src');

export default defineConfig({
  root: './renderer',
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(srcRootPath, './'),
      '@config': path.resolve(srcRootPath, './config'),
      '@scenes': path.resolve(srcRootPath, './scenes'),
      '@utils': path.resolve(srcRootPath, './utils'),
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'renderer/index.html'),
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },
});
