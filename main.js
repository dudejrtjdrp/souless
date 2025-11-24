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
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    resizable: false,
    fullscreen: true,
    title: 'Souless',
    backgroundColor: '#000000',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// ============================================
// 세이브 시스템 IPC 핸들러 (슬롯별로 수정)
// ============================================

/**
 * 슬롯별 세이브 파일 경로 생성
 * @param {number} slotIndex - 슬롯 인덱스 (0, 1, 2)
 */
const getSavePath = (slotIndex) => {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, `save_slot_${slotIndex}.json`);
};

/**
 * 세이브 파일 로드
 * @param {number} slotIndex - 로드할 슬롯 인덱스
 */
ipcMain.handle('load-save', async (event, slotIndex) => {
  try {
    const savePath = getSavePath(slotIndex);
    const data = await fs.readFile(savePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 null 반환
      return null;
    }
    console.error(`Load save error (slot ${slotIndex}):`, error);
    throw error;
  }
});

/**
 * 세이브 파일 저장
 * @param {Object} data - 저장할 데이터
 * @param {number} slotIndex - 저장할 슬롯 인덱스
 */
ipcMain.handle('save-save', async (event, data, slotIndex) => {
  try {
    const savePath = getSavePath(slotIndex);
    await fs.writeFile(savePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Save save error (slot ${slotIndex}):`, error);
    throw error;
  }
});

/**
 * 세이브 파일 삭제
 * @param {number} slotIndex - 삭제할 슬롯 인덱스
 */
ipcMain.handle('clear-save', async (event, slotIndex) => {
  try {
    const savePath = getSavePath(slotIndex);
    await fs.unlink(savePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 성공으로 처리
      return true;
    }
    console.error(`Clear save error (slot ${slotIndex}):`, error);
    throw error;
  }
});

/**
 * 세이브 파일 경로 가져오기 (디버그용)
 * @param {number} slotIndex - 조회할 슬롯 인덱스
 */
ipcMain.handle('get-save-path', (event, slotIndex) => {
  return getSavePath(slotIndex);
});
