import { contextBridge, ipcRenderer } from 'electron';

// Renderer process에 electron API 노출
contextBridge.exposeInMainWorld('electron', {
  // 전체화면 토글
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

  // 앱 경로 가져오기
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // 세이브 시스템 API (슬롯 인덱스 추가)

  /**
   * 세이브 파일 로드
   * @param {number} slotIndex - 로드할 슬롯 인덱스 (0, 1, 2)
   */
  loadSave: (slotIndex) => ipcRenderer.invoke('load-save', slotIndex),

  /**
   * 세이브 파일 저장
   * @param {Object} data - 저장할 데이터
   * @param {number} slotIndex - 저장할 슬롯 인덱스 (0, 1, 2)
   */
  saveSave: (data, slotIndex) => ipcRenderer.invoke('save-save', data, slotIndex),

  /**
   * 세이브 파일 삭제
   * @param {number} slotIndex - 삭제할 슬롯 인덱스 (0, 1, 2)
   */
  clearSave: (slotIndex) => ipcRenderer.invoke('clear-save', slotIndex),

  /**
   * 세이브 파일 경로 가져오기 (디버그용)
   * @param {number} slotIndex - 조회할 슬롯 인덱스 (0, 1, 2)
   */
  getSavePath: (slotIndex) => ipcRenderer.invoke('get-save-path', slotIndex),
});
