// utils/SaveManager.js
// Electron + Vite 환경을 위한 SaveManager

import { CharacterData } from '../config/characterData';

export default class SaveManager {
  static SAVE_KEY = 'game_save_data';

  /**
   * Electron 환경인지 확인
   */
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  /**
   * 세이브 데이터 로드
   */
  static async load() {
    try {
      if (this.isElectron()) {
        // Electron 환경: IPC 통신으로 파일 읽기
        const data = await window.electron.loadSave();
        console.log('📂 Loaded from Electron:', data);
        return data;
      } else {
        // 브라우저 환경: localStorage 사용 (개발/테스트용)
        const data = localStorage.getItem(this.SAVE_KEY);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('❌ Save load error:', error);
      return null;
    }
  }

  /**
   * 세이브 데이터 저장
   */
  static async save(data) {
    try {
      if (this.isElectron()) {
        // Electron 환경: IPC 통신으로 파일 쓰기
        await window.electron.saveSave(data);
        // console.log('💾 Saved to Electron:', data);
      } else {
        // 브라우저 환경: localStorage 사용
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        // console.log('💾 Saved to localStorage:', data);
      }
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  }

  /**
   * 현재 위치 저장 (맵 내에서 캐릭터 전환 시)
   */
  static async savePosition(mapKey, x, y, characterType) {
    const saveData = (await this.load()) || {};
    saveData.lastPosition = {
      mapKey,
      x,
      y,
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: false, // 포탈이 아닌 일반 위치
      timestamp: Date.now(),
    };

    return await this.save(saveData);
  }

  /**
   * 포탈 이동 시 위치 저장
   */
  static async savePortalPosition(targetMapKey, portalId, characterType) {
    const saveData = (await this.load()) || {};

    saveData.lastPosition = {
      mapKey: targetMapKey,
      portalId, // 다음 맵의 도착 포탈 ID
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: true,
      timestamp: Date.now(),
    };

    return await this.save(saveData);
  }

  /**
   * 저장된 위치 가져오기
   */
  static async getSavedPosition() {
    const saveData = await this.load();
    return saveData?.lastPosition || null;
  }

  /**
   * 캐릭터별 상태 저장 (체력, 마나 등)
   */
  static async saveCharacterState(characterType, state) {
    const saveData = (await this.load()) || {};

    if (!saveData.characters) {
      saveData.characters = {};
    }

    saveData.characters[characterType] = {
      ...state,
      timestamp: Date.now(),
    };

    return await this.save(saveData);
  }

  /**
   * 캐릭터 상태 로드
   */
  static async getCharacterState(characterType) {
    const saveData = await this.load();
    return saveData?.characters?.[characterType] || null;
  }

  /**
   * 세이브 데이터 초기화
   */
  static async clear() {
    if (this.isElectron()) {
      await window.electron.clearSave();
      console.log('🗑️ Electron save data cleared');
    } else {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('🗑️ localStorage save data cleared');
    }
  }

  /**
   * 세이브 파일 존재 여부
   */
  static async exists() {
    const data = await this.load();
    return data !== null && data !== undefined;
  }

  /**
   * 디버그: 전체 세이브 데이터 출력
   */
  static async debug() {
    const data = await this.load();
    console.log('📋 Save Data:', data);
    return data;
  }
}
