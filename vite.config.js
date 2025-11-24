import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcRootPath = path.join(__dirname, 'src');

export default defineConfig({
  root: './renderer',
  base: './', // 상대 경로

  // public 폴더가 renderer 내부에 있으므로 경로 수정
  publicDir: './public', // '../public'이 아니라 './public'

  resolve: {
    alias: {
      '@': path.resolve(srcRootPath, './'),
      '@config': path.resolve(srcRootPath, './config'),
      '@scenes': path.resolve(srcRootPath, './scenes'),
      '@utils': path.resolve(srcRootPath, './utils'),
      '@entities': path.resolve(srcRootPath, './entities'),
      '@systems': path.resolve(srcRootPath, './systems'),
      '@models': path.resolve(srcRootPath, './models'),
      '@ui': path.resolve(srcRootPath, './ui'),
      '@controllers': path.resolve(srcRootPath, './controllers'),
      '@views': path.resolve(srcRootPath, './views'),
      '@core': path.resolve(srcRootPath, './core'),
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'renderer/index.html'),
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
});
