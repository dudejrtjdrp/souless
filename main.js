import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.defaultApp ||
  /[\\/]electron[\\/]/.test(process.execPath);

console.log('isDev:', isDev);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: false,
      sandbox: false,
    },
    resizable: false, // 창 크기 고정
    fullscreen: false,
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
    console.log('📂 Save loaded from:', savePath);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 null 반환
      console.log('📭 No save file found');
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
    console.log('💾 Save file written to:', savePath);
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
    console.log('🗑️ Save file deleted');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 성공으로 처리
      console.log('🗑️ No save file to delete');
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
  console.log('📍 Save path:', savePath);
  return savePath;
});
