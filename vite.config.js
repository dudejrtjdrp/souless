import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['phaser'],
  },
  server: {
    open: true,
  },
});
