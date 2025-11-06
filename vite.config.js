import { defineConfig } from 'vite';
import path, { resolve } from 'path'; // 👈 path 모듈 전체를 import 합니다.
import { fileURLToPath } from 'url';

// 1. __filename과 __dirname 설정은 ESM 환경에서 Node.js 모듈처럼 사용하기 위한 표준 방식입니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. srcPath 재정의:
//    Vite Root이 './renderer'이므로, 렌더러 코드가 있는 'src' 폴더는
//    프로젝트 루트 (즉, __dirname) 바로 아래에 있다고 가정합니다.
//    만약 'scenes' 폴더 등이 'src' 폴더 안에 있다면 이 경로는 올바릅니다.
const srcRootPath = path.join(__dirname, 'src');

export default defineConfig({
  // Vite 개발 서버의 루트를 'renderer' 폴더로 설정합니다.
  root: './renderer',
  base: './',

  resolve: {
    alias: {
      // 3. 앨리어스 설정: '@' 접두사가 srcRootPath를 가리키도록 설정합니다.
      // 이 앨리어스는 'renderer/renderer.js'와 같은 파일에서 사용될 것입니다.
      '@': path.resolve(srcRootPath, './'), // @/GameScene.js -> .../src/GameScene.js
      '@config': path.resolve(srcRootPath, './config'),
      // ... (나머지 @alias 설정은 path.resolve(srcRootPath, ...)로 통일됩니다.)
      '@scenes': path.resolve(srcRootPath, './scenes'),
      '@utils': path.resolve(srcRootPath, './utils'),
      // ...
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
