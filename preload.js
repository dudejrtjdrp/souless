import { contextBridge, ipcRenderer } from 'electron';

// Renderer 프로세스에서 사용할 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  // 필요한 다른 API들 추가
});
