import { contextBridge, ipcRenderer } from 'electron';

// Renderer process에 electron API 노출
contextBridge.exposeInMainWorld('electron', {
  // 전체화면 토글
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

  // 앱 경로 가져오기
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // ===== 🎮 세이브 시스템 API =====

  /**
   * 세이브 파일 로드
   */
  loadSave: () => ipcRenderer.invoke('load-save'),

  /**
   * 세이브 파일 저장
   * @param {Object} data - 저장할 데이터
   */
  saveSave: (data) => ipcRenderer.invoke('save-save', data),

  /**
   * 세이브 파일 삭제
   */
  clearSave: () => ipcRenderer.invoke('clear-save'),

  /**
   * 세이브 파일 경로 가져오기 (디버그용)
   */
  getSavePath: () => ipcRenderer.invoke('get-save-path'),
});
