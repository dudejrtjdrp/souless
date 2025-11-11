import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.defaultApp ||
  /[\\/]electron[\\/]/.test(process.execPath);

let mainWindow;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const winWidth = 1280;
  const winHeight = 720;
  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    // x: Math.floor((screenWidth - winWidth) / 2),
    // y: screenHeight - winHeight,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: false,
      sandbox: false,
    },
    resizable: false, // 창 크기 고정
    fullscreen: true,
    title: 'Soul Game',
    backgroundColor: '#000000',
  });

  // 개발 모드: Vite 개발 서버로 연결
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
  // 프로덕션 모드: 빌드된 파일 로드
  else {
    mainWindow.loadFile(join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // mainWindow.center();

  // IPC로 전체화면 토글
  ipcMain.on('toggle-fullscreen', () => {
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 통신 예제 (필요시 사용)
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// ===== 🎮 세이브 시스템 IPC 핸들러 =====

// 세이브 파일 경로 설정
const SAVE_FILE_NAME = 'save.json';
const getSavePath = () => {
  // userData 디렉토리에 저장
  // Windows: C:\Users\{username}\AppData\Roaming\Soul Game
  // macOS: ~/Library/Application Support/Soul Game
  // Linux: ~/.config/Soul Game
  const userDataPath = app.getPath('userData');
  return join(userDataPath, SAVE_FILE_NAME);
};

/**
 * 세이브 파일 로드
 */
ipcMain.handle('load-save', async () => {
  try {
    const savePath = getSavePath();
    const data = await fs.readFile(savePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 null 반환
      return null;
    }
    console.error('❌ Load save error:', error);
    throw error;
  }
});

/**
 * 세이브 파일 저장
 */
ipcMain.handle('save-save', async (event, data) => {
  try {
    const savePath = getSavePath();
    await fs.writeFile(savePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('❌ Save save error:', error);
    throw error;
  }
});

/**
 * 세이브 파일 삭제
 */
ipcMain.handle('clear-save', async () => {
  try {
    const savePath = getSavePath();
    await fs.unlink(savePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 성공으로 처리
      return true;
    }
    console.error('❌ Clear save error:', error);
    throw error;
  }
});

/**
 * 세이브 파일 경로 가져오기 (디버그용)
 */
ipcMain.handle('get-save-path', () => {
  const savePath = getSavePath();
  return savePath;
});
