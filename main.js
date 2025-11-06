import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  console.log(isDev);

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
