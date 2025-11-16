// utils/SaveManager.js
// Electron + Vite 환경을 위한 SaveManager

import { CharacterData } from '../config/characterData';

export default class SaveManager {
  static SAVE_KEY = 'game_save_data';

  /** Electron 환경인지 확인 */
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  /** 기본 세이브 데이터 구조 */
  static getDefaultSaveData() {
    return {
      totalExp: 0,
      characterExp: {},
      characters: {}, // 캐릭터별 상태 (HP, MP, 레벨 등)
      skillCooldowns: {}, // 캐릭터별 스킬 쿨타임 저장
      lastPosition: null,
    };
  }

  /** 세이브 데이터 로드 */
  static async load() {
    try {
      let data = null;

      if (this.isElectron()) {
        data = await window.electron.loadSave();
      } else {
        const stored = localStorage.getItem(this.SAVE_KEY);
        data = stored ? JSON.parse(stored) : null;
      }

      // 기본 구조와 병합 (기존 데이터 보존)
      const defaultData = this.getDefaultSaveData();
      return data ? { ...defaultData, ...data } : defaultData;
    } catch (error) {
      console.error('❌ Save load error:', error);
      return this.getDefaultSaveData();
    }
  }

  /** 세이브 데이터 저장 */
  static async save(data) {
    try {
      if (this.isElectron()) {
        await window.electron.saveSave(data);
      } else {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      }
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  }

  /** 현재 위치 저장 (맵 내 캐릭터 전환 시) */
  static async savePosition(mapKey, x, y, characterType) {
    const saveData = await this.load();
    saveData.lastPosition = {
      mapKey,
      x,
      y,
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: false,
      isPortalSpawn: false, // 일반 위치 저장
      timestamp: Date.now(),
    };
    return await this.save(saveData);
  }

  /** 포탈 이동 시 위치 저장 */
  static async savePortalPosition(targetMapKey, portalId, characterType) {
    const saveData = await this.load();
    saveData.lastPosition = {
      mapKey: targetMapKey,
      portalId,
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: true,
      isPortalSpawn: true, // 포탈 스폰 표시
      timestamp: Date.now(),
    };
    return await this.save(saveData);
  }

  /** 저장된 위치 가져오기 */
  static async getSavedPosition() {
    const saveData = await this.load();
    return saveData?.lastPosition || null;
  }

  static async getSaveData() {
    return await this.load();
  }

  /**
   *  캐릭터별 상태 저장 (체력, 마나, 경험치 등)
   * @param {string} characterType - 캐릭터 타입
   * @param {Object} state - 저장할 상태 { hp, mp, maxHp, maxMp, exp, level, ... }
   */
  static async saveCharacterState(characterType, state) {
    const saveData = await this.load();

    if (!saveData.characters) saveData.characters = {};

    // 기존 캐릭터 데이터와 병합
    const prevCharacterState = saveData.characters[characterType] || {};

    saveData.characters[characterType] = {
      ...prevCharacterState,
      ...state,
      timestamp: Date.now(),
    };

    // 경험치 관련 처리
    if (state.exp !== undefined) {
      saveData.characters[characterType].exp = state.exp;
    }

    // 총 경험치 자동 업데이트
    if (state.gainedExp) {
      saveData.totalExp = (saveData.totalExp || 0) + state.gainedExp;
    }

    const success = await this.save(saveData);

    if (success) {
    }

    return success;
  }

  /**
   *  캐릭터 상태 로드
   * @param {string} characterType - 캐릭터 타입
   * @returns {Object|null} 저장된 캐릭터 상태 또는 null
   */
  static async getCharacterState(characterType) {
    const saveData = await this.load();
    const state = saveData?.characters?.[characterType] || null;

    return state;
  }

  /**
   *  캐릭터의 체력/마나만 빠르게 저장
   * @param {string} characterType - 캐릭터 타입
   * @param {number} hp - 현재 체력
   * @param {number} mp - 현재 마나
   */
  static async saveCharacterResources(characterType, hp, mp) {
    const saveData = await this.load();

    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};

    saveData.characters[characterType].hp = hp;
    saveData.characters[characterType].mp = mp;
    saveData.characters[characterType].timestamp = Date.now();

    return await this.save(saveData);
  }

  /**
   *  캐릭터의 체력/마나 로드
   * @param {string} characterType - 캐릭터 타입
   * @returns {Object|null} { hp, mp } 또는 null
   */
  static async getCharacterResources(characterType) {
    const state = await this.getCharacterState(characterType);

    if (state && state.hp !== undefined && state.mp !== undefined) {
      return {
        hp: state.hp,
        mp: state.mp,
      };
    }

    return null;
  }

  /** 총 경험치 불러오기 */
  static async getTotalExp() {
    const saveData = await this.load();
    return saveData?.totalExp || 0;
  }

  /**
   *  경험치 추가 (총 경험치 + 캐릭터별 경험치)
   * @param {number} amount - 추가할 경험치
   * @param {string} characterType - 캐릭터 타입 (예: 'warrior', 'mage')
   */
  static async addExp(amount, characterType) {
    if (amount <= 0) return;

    const data = await this.getSaveData();

    // 총 경험치 추가
    data.totalExp = (data.totalExp || 0) + amount;

    // 캐릭터별 경험치 추가
    data.characterExp = data.characterExp || {};
    data.characterExp[characterType] = (data.characterExp[characterType] || 0) + amount;

    // 캐릭터 상태에도 경험치 업데이트
    if (!data.characters) data.characters = {};
    if (!data.characters[characterType]) data.characters[characterType] = {};
    data.characters[characterType].exp = data.characterExp[characterType];

    await this.save(data);

    return {
      characterExp: data.characterExp[characterType],
      totalExp: data.totalExp,
    };
  }

  /** 특정 캐릭터의 경험치 추가 (기존 메서드 유지) */
  static async addCharacterExp(characterType, amount) {
    const data = await this.getSaveData();
    data.characterExp = data.characterExp || {};
    data.characterExp[characterType] = (data.characterExp[characterType] || 0) + amount;

    // 캐릭터 상태에도 반영
    if (!data.characters) data.characters = {};
    if (!data.characters[characterType]) data.characters[characterType] = {};
    data.characters[characterType].exp = data.characterExp[characterType];

    await this.save(data);
  }

  static async addTotalExp(amount) {
    const data = await this.getSaveData();
    data.totalExp = (data.totalExp || 0) + amount;
    await this.save(data);
  }

  static async getExpData() {
    const data = await this.getSaveData();
    return {
      totalExp: data.totalExp || 0,
      characterExp: data.characterExp || {},
    };
  }

  /** 세이브 데이터 초기화 */
  static async clear() {
    if (this.isElectron()) {
      await window.electron.clearSave();
    } else {
      localStorage.removeItem(this.SAVE_KEY);
    }
  }

  /** 세이브 파일 존재 여부 */
  static async exists() {
    const data = await this.load();
    return data !== null && data !== undefined;
  }

  /** 스킬 쿨타임 저장 */
  static async saveSkillCooldown(characterType, skillKey, cooldownEndTime) {
    const saveData = await this.load();

    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    if (!saveData.skillCooldowns[characterType]) saveData.skillCooldowns[characterType] = {};

    saveData.skillCooldowns[characterType][skillKey] = cooldownEndTime;

    await this.save(saveData);
  }

  /** 모든 스킬 쿨타임 저장 (한 번에) */
  static async saveAllSkillCooldowns(characterType, cooldowns) {
    const saveData = await this.load();

    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    saveData.skillCooldowns[characterType] = cooldowns;

    await this.save(saveData);
  }

  /** 캐릭터의 스킬 쿨타임 불러오기 */
  static async getSkillCooldowns(characterType) {
    const saveData = await this.load();
    return saveData?.skillCooldowns?.[characterType] || {};
  }

  /** 특정 스킬의 남은 쿨타임 계산 */
  static async getRemainingCooldown(characterType, skillKey) {
    const cooldowns = await this.getSkillCooldowns(characterType);
    const cooldownEndTime = cooldowns[skillKey];

    if (!cooldownEndTime) return 0;

    const remaining = cooldownEndTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /** 만료된 쿨타임 정리 */
  static async cleanExpiredCooldowns(characterType) {
    const saveData = await this.load();

    if (!saveData.skillCooldowns?.[characterType]) return;

    const now = Date.now();
    const cooldowns = saveData.skillCooldowns[characterType];

    // 만료된 쿨타임 제거
    Object.keys(cooldowns).forEach((skillKey) => {
      if (cooldowns[skillKey] <= now) {
        delete cooldowns[skillKey];
      }
    });

    await this.save(saveData);
  }
}
