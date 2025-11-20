// utils/SaveSlotManager.js - 완전 통합 버전
// SaveManager.js는 삭제 가능

import { CharacterData } from '../config/characterData';

export default class SaveSlotManager {
  // === 상수 ===
  static SLOT_PREFIX = 'save_slot_';
  static CURRENT_SLOT_KEY = 'current_slot';
  static MAX_SLOTS = 3;

  // === 환경 감지 ===
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  // === 슬롯 관리 ===
  static getCurrentSlot() {
    const v = localStorage.getItem(this.CURRENT_SLOT_KEY);
    const slot = v !== null ? parseInt(v, 10) : 0;

    console.log(`📍 현재 슬롯: ${slot} (localStorage: ${v})`);

    return slot;
  }

  static getDefaultSaveData() {
    return {
      // 경험치 시스템
      levelSystem: {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
      },
      totalExp: 0,
      characterExp: {},

      // 캐릭터 데이터
      characters: {},
      currentCharacter: 'soul',

      // 게임 데이터
      lastPosition: null,
      skillCooldowns: {},

      // 메타 데이터
      slotIndex: null,
      timestamp: Date.now(),
    };
  }

  // === 핵심 저장/로드 ===
  static async load(slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      let data = null;

      if (this.isElectron()) {
        data = await window.electron.loadSave(targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          const storedSlot = localStorage.getItem(`${this.SLOT_PREFIX}${targetSlotIndex}`);
          data = storedSlot ? JSON.parse(storedSlot) : null;
        } else {
          console.error(`❌ Load error: Invalid slot index ${targetSlotIndex}`);
          return null;
        }
      }

      return data ? { ...this.getDefaultSaveData(), ...data } : null;
    } catch (error) {
      console.error('❌ Load error:', error);
      return null;
    }
  }

  static async save(data, slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      const dataToSave = { ...data, timestamp: Date.now() };

      if (this.isElectron()) {
        await window.electron.saveSave(dataToSave, targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          localStorage.setItem(`${this.SLOT_PREFIX}${targetSlotIndex}`, JSON.stringify(dataToSave));
        } else {
          console.error(`❌ Save error: Invalid slot index ${targetSlotIndex}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  }

  static async clear(slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      if (this.isElectron()) {
        await window.electron.clearSave(targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          localStorage.removeItem(`${this.SLOT_PREFIX}${targetSlotIndex}`);
        }
      }
    } catch (error) {
      console.error('❌ Clear error:', error);
    }
  }

  // === 슬롯 관리 기능 ===
  static extractSlotSummary(saveData) {
    if (!saveData) return null;

    const characterType =
      saveData.currentCharacter || saveData.lastPosition?.characterType || 'soul';

    return {
      characterType,
      mapKey: saveData.lastPosition?.mapKey || 'map1',
      timestamp: saveData.timestamp || Date.now(),
      totalExp: saveData.totalExp || 0,
      level: saveData.levelSystem?.level || 1,
      slotIndex: saveData.slotIndex,
    };
  }

  static async loadAllSlots() {
    const slots = new Array(this.MAX_SLOTS).fill(null);

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const slotData = await this.load(i);
      slots[i] = slotData ? this.extractSlotSummary(slotData) : null;
    }

    return slots;
  }

  static async loadSlotData(slotIndex) {
    try {
      const data = await this.load(slotIndex);
      return data || null;
    } catch (err) {
      console.error(`Error loading slot ${slotIndex}:`, err);
      return null;
    }
  }

  static async saveSlotData(slotIndex, data) {
    try {
      const characterType = data.currentCharacter || data.lastPosition?.characterType || 'soul';
      const payload = {
        ...data,
        slotIndex,
        currentCharacter: characterType,
        timestamp: Date.now(),
      };

      if (payload.lastPosition) {
        payload.lastPosition.characterType = characterType;
      }

      console.log(`💾 슬롯 ${slotIndex} 저장 시도:`, payload);

      const result = await this.save(payload, slotIndex);

      if (result) {
        console.log(`✅ 슬롯 ${slotIndex} 저장 완료`);

        // ✅ 저장 검증
        if (!this.isElectron()) {
          const slotKey = `${this.SLOT_PREFIX}${slotIndex}`;
          const stored = localStorage.getItem(slotKey);
          console.log(`📦 localStorage 확인 (${slotKey}):`, stored ? 'OK' : 'FAILED');
        }
      } else {
        console.error(`❌ 슬롯 ${slotIndex} 저장 실패`);
      }

      return result;
    } catch (err) {
      console.error(`❌ Error saving slot ${slotIndex}:`, err);
      return false;
    }
  }
  static async selectSlot(slotIndex, existingSlotData = null) {
    console.log(`🎯 슬롯 선택: ${slotIndex}, 기존 데이터: ${existingSlotData}`);

    const prevSlot = this.getCurrentSlot();

    // 이전 슬롯 백업
    if (prevSlot !== null && prevSlot !== slotIndex) {
      const prevData = await this.load(prevSlot);
      if (prevData) {
        await this.saveSlotData(prevSlot, prevData);
        console.log(`💾 이전 슬롯 ${prevSlot} 백업 완료`);
      }
    }

    // ✅ 현재 활성 슬롯 업데이트 (먼저 설정!)
    localStorage.setItem(this.CURRENT_SLOT_KEY, String(slotIndex));
    console.log(`📍 활성 슬롯 변경: ${prevSlot} → ${slotIndex}`);

    if (existingSlotData) {
      // 기존 게임 로드
      const fullData = await this.loadSlotData(slotIndex);
      if (fullData) {
        console.log(`✅ 기존 슬롯 ${slotIndex} 로드 완료`);
        return;
      }
    }

    // ✅ 새 게임 시작 - 초기 데이터 생성
    console.log(`📝 슬롯 ${slotIndex} 초기 데이터 생성 중...`);

    const newData = this.getDefaultSaveData();
    newData.slotIndex = slotIndex;
    newData.currentCharacter = 'soul';
    newData.timestamp = Date.now();

    // ✅ 즉시 저장
    const saved = await this.saveSlotData(slotIndex, newData);

    if (saved) {
      console.log(`✅ 슬롯 ${slotIndex} 초기화 완료`);

      // ✅ 저장 확인
      const verification = await this.load(slotIndex);
      if (verification) {
        console.log('✅ 초기 데이터 저장 검증 완료:', verification);
      } else {
        console.error('❌ 초기 데이터 저장 검증 실패!');
      }
    } else {
      console.error(`❌ 슬롯 ${slotIndex} 초기화 실패`);
    }
  }

  static async backupCurrentSlot() {
    const slot = this.getCurrentSlot();
    const data = await this.load(slot);
    if (data) {
      await this.saveSlotData(slot, data);
    }
  }

  static async immediateBackup() {
    await this.backupCurrentSlot();
  }

  static async deleteSlot(slotIndex) {
    try {
      await this.clear(slotIndex);
      const current = this.getCurrentSlot();
      if (current === slotIndex) {
        localStorage.removeItem(this.CURRENT_SLOT_KEY);
      }
      return true;
    } catch (err) {
      console.error(`Error deleting slot ${slotIndex}:`, err);
      return false;
    }
  }

  static async isSlotEmpty(slotIndex) {
    const data = await this.loadSlotData(slotIndex);
    return data === null;
  }

  static async clearAllSlots() {
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      await this.clear(i);
    }
    localStorage.removeItem(this.CURRENT_SLOT_KEY);
  }

  // === 캐릭터 데이터 ===
  static async updateCurrentCharacter(characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
    saveData.currentCharacter = characterType;
    if (saveData.lastPosition) {
      saveData.lastPosition.characterType = characterType;
    }
    return await this.save(saveData);
  }

  static async getCurrentCharacter() {
    const saveData = await this.load();
    if (!saveData) return 'soul';
    return saveData.lastPosition?.characterType || saveData.currentCharacter || 'soul';
  }

  // === 위치 관리 ===
  static async savePosition(mapKey, x, y, characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
    saveData.currentCharacter = characterType;
    saveData.lastPosition = {
      mapKey,
      x,
      y,
      characterType,
      physics: CharacterData[characterType]?.physics?.collisionBox || null,
      fromPortal: false,
      isPortalSpawn: false,
      timestamp: Date.now(),
    };
    return await this.save(saveData);
  }

  static async savePortalPosition(targetMapKey, portalId, characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
    saveData.currentCharacter = characterType;
    saveData.lastPosition = {
      mapKey: targetMapKey,
      portalId,
      characterType,
      physics: CharacterData[characterType]?.physics?.collisionBox || null,
      fromPortal: true,
      isPortalSpawn: true,
      timestamp: Date.now(),
    };
    return await this.save(saveData);
  }

  static async getSavedPosition() {
    const saveData = await this.load();
    if (!saveData) return null;
    return saveData.lastPosition || null;
  }

  // === 캐릭터 상태 ===
  static async saveCharacterState(characterType, state) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.characters) saveData.characters = {};
    saveData.characters[characterType] = {
      ...saveData.characters[characterType],
      ...state,
      timestamp: Date.now(),
    };
    if (state.gainedExp) {
      saveData.totalExp = (saveData.totalExp || 0) + state.gainedExp;
    }
    return await this.save(saveData);
  }

  static async getCharacterState(characterType) {
    const saveData = await this.load();
    return saveData?.characters?.[characterType] || null;
  }

  // === 캐릭터 리소스 (체력/마나) ===
  static async saveCharacterResources(characterType, hp, mp) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};
    saveData.characters[characterType].hp = hp;
    saveData.characters[characterType].mp = mp;
    saveData.characters[characterType].timestamp = Date.now();
    return await this.save(saveData);
  }

  static async getCharacterResources(characterType) {
    const state = await this.getCharacterState(characterType);
    if (state && state.hp !== undefined && state.mp !== undefined) {
      return { hp: state.hp, mp: state.mp };
    }
    return null;
  }

  // === 경험치 시스템 ===
  static async addExp(amount, characterType) {
    if (amount <= 0) return false;

    let data = await this.load();

    // ✅ 데이터가 없으면 새로 생성
    if (!data) {
      console.warn('⚠️ 세이브 데이터가 없습니다. 새로 생성합니다.');
      data = this.getDefaultSaveData();
      data.currentCharacter = characterType;

      // 현재 슬롯에 초기 데이터 저장
      const currentSlot = this.getCurrentSlot();
      await this.save(data, currentSlot);

      console.log(`✅ 슬롯 ${currentSlot}에 초기 데이터 생성 완료`);
    }

    data.totalExp = (data.totalExp || 0) + amount;
    data.characterExp = data.characterExp || {};
    data.characterExp[characterType] = (data.characterExp[characterType] || 0) + amount;

    if (!data.characters) data.characters = {};
    if (!data.characters[characterType]) data.characters[characterType] = {};
    data.characters[characterType].exp = data.characterExp[characterType];

    console.log('💾 저장 전 데이터:', {
      totalExp: data.totalExp,
      characterExp: data.characterExp,
    });

    const saved = await this.save(data);

    if (saved) {
      console.log('✅ localStorage 저장 완료');

      // 저장 확인
      const slotKey = `${this.SLOT_PREFIX}${this.getCurrentSlot()}`;
      const storedData = localStorage.getItem(slotKey);
      console.log('📦 저장된 데이터 확인:', storedData ? JSON.parse(storedData) : 'FAILED');
    } else {
      console.error('❌ localStorage 저장 실패');
    }

    return { characterExp: data.characterExp[characterType], totalExp: data.totalExp };
  }

  static async getExpData() {
    const data = await this.load();
    if (!data) return { totalExp: 0, characterExp: {} };
    return { totalExp: data.totalExp || 0, characterExp: data.characterExp || {} };
  }

  // === 레벨 시스템 ===
  static async saveLevelSystem(levelData) {
    const saveData = await this.load();
    if (!saveData) return false;
    saveData.levelSystem = levelData;
    return await this.save(saveData);
  }

  static async getLevelSystem() {
    const saveData = await this.load();
    if (!saveData) {
      return {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
      };
    }
    return (
      saveData.levelSystem || {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
      }
    );
  }

  // === 스킬 쿨타임 ===
  static async saveSkillCooldown(characterType, skillKey, cooldownEndTime) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    if (!saveData.skillCooldowns[characterType]) saveData.skillCooldowns[characterType] = {};
    saveData.skillCooldowns[characterType][skillKey] = cooldownEndTime;
    return await this.save(saveData);
  }

  static async saveAllSkillCooldowns(characterType, cooldowns) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    saveData.skillCooldowns[characterType] = cooldowns;
    return await this.save(saveData);
  }

  static async getSkillCooldowns(characterType) {
    const saveData = await this.load();
    return saveData?.skillCooldowns?.[characterType] || {};
  }

  static async getRemainingCooldown(characterType, skillKey) {
    const cooldowns = await this.getSkillCooldowns(characterType);
    const remaining = (cooldowns[skillKey] || 0) - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  static async cleanExpiredCooldowns(characterType) {
    const saveData = await this.load();
    if (!saveData) return;
    const now = Date.now();
    const cooldowns = saveData?.skillCooldowns?.[characterType] || {};

    Object.keys(cooldowns).forEach((key) => {
      if (cooldowns[key] <= now) delete cooldowns[key];
    });

    await this.save(saveData);
  }
}
