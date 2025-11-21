// utils/SaveSlotManager.js - 슬롯 분리 수정 버전

import { CharacterData } from '../config/characterData';

export default class SaveSlotManager {
  // === 상수 ===
  static SLOT_PREFIX = 'save_slot_';
  static CURRENT_SLOT_KEY = 'current_slot';
  static MAX_SLOTS = 3;

  // === 캐싱 (슬롯별로 관리) ===
  static _cachedSlot = null;
  static _cachedData = null;
  static _saveQueue = [];
  static _isSaving = false;

  // === 환경 감지 ===
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  // === 슬롯 관리 ===
  static getCurrentSlot() {
    if (this._cachedSlot !== null) {
      return this._cachedSlot;
    }

    const v = localStorage.getItem(this.CURRENT_SLOT_KEY);
    this._cachedSlot = v !== null ? parseInt(v, 10) : 0;

    console.log(`📍 현재 슬롯: ${this._cachedSlot}`);

    return this._cachedSlot;
  }

  static getDefaultSaveData() {
    return {
      levelSystem: {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
      },
      totalExp: 0,
      characterExp: {},
      characters: {},
      currentCharacter: 'soul',
      lastPosition: null,
      skillCooldowns: {},
      slotIndex: null,
      timestamp: Date.now(),
    };
  }

  // ✅ 캐시 초기화 메서드 추가
  static clearCache() {
    console.log('🗑️ 캐시 초기화');
    this._cachedData = null;
    // _cachedSlot은 유지 (현재 활성 슬롯)
  }

  // === 핵심 저장/로드 ===
  static async load(slotIndex = null) {
    const targetSlot = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    // ✅ 캐시 확인 시 슬롯 인덱스도 검증
    if (this._cachedData && this._cachedData.slotIndex === targetSlot) {
      console.log(`💾 캐시에서 로드: 슬롯 ${targetSlot}`);
      return this._cachedData;
    }

    console.log(`📂 localStorage에서 로드: 슬롯 ${targetSlot}`);

    try {
      let data = null;

      if (this.isElectron()) {
        data = await window.electron.loadSave(targetSlot);
      } else {
        if (targetSlot >= 0 && targetSlot < this.MAX_SLOTS) {
          const storedSlot = localStorage.getItem(`${this.SLOT_PREFIX}${targetSlot}`);
          data = storedSlot ? JSON.parse(storedSlot) : null;
        } else {
          console.error(`❌ Load error: Invalid slot index ${targetSlot}`);
          return null;
        }
      }

      // ✅ 데이터가 있으면 캐싱
      if (data) {
        this._cachedData = { ...this.getDefaultSaveData(), ...data };
        console.log(`✅ 슬롯 ${targetSlot} 로드 완료:`, this._cachedData);
        return this._cachedData;
      }

      console.log(`⚠️ 슬롯 ${targetSlot}이 비어있음`);
      return null;
    } catch (error) {
      console.error('❌ Load error:', error);
      return null;
    }
  }

  static async save(data, slotIndex = null) {
    const targetSlot = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    const dataToSave = {
      ...data,
      timestamp: Date.now(),
      slotIndex: targetSlot,
    };

    console.log(`💾 저장 시도: 슬롯 ${targetSlot}`);

    // ✅ 캐시 업데이트 (슬롯 인덱스 포함)
    this._cachedData = dataToSave;

    // 큐에 추가
    this._saveQueue.push({ data: dataToSave, slot: targetSlot });

    // 즉시 처리 시작
    if (!this._isSaving) {
      this.processSaveQueue();
    }

    return true;
  }

  // ✅ 큐 처리 (배치 저장)
  static async processSaveQueue() {
    if (this._saveQueue.length === 0) {
      this._isSaving = false;
      return;
    }

    this._isSaving = true;

    // 마지막 저장 요청만 처리
    const lastSave = this._saveQueue[this._saveQueue.length - 1];
    this._saveQueue = [];

    try {
      if (this.isElectron()) {
        await window.electron.saveSave(lastSave.data, lastSave.slot);
      } else {
        localStorage.setItem(`${this.SLOT_PREFIX}${lastSave.slot}`, JSON.stringify(lastSave.data));
      }
      console.log(`✅ 슬롯 ${lastSave.slot} 저장 완료`);
    } catch (error) {
      console.error('❌ Save error:', error);
    }

    // 다음 큐 처리
    if (this._saveQueue.length > 0) {
      setTimeout(() => this.processSaveQueue(), 0);
    } else {
      this._isSaving = false;
    }
  }

  static async clear(slotIndex = null) {
    const targetSlot = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    console.log(`🗑️ 슬롯 ${targetSlot} 삭제`);

    try {
      if (this.isElectron()) {
        await window.electron.clearSave(targetSlot);
      } else {
        if (targetSlot >= 0 && targetSlot < this.MAX_SLOTS) {
          localStorage.removeItem(`${this.SLOT_PREFIX}${targetSlot}`);
        }
      }

      // ✅ 캐시도 초기화
      if (this._cachedData?.slotIndex === targetSlot) {
        this._cachedData = null;
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

    // ✅ levelSystem.totalExperience 사용 (실제 누적 경험치)
    const totalExp = saveData.levelSystem?.totalExperience || 0;
    const level = saveData.levelSystem?.level || 1;

    return {
      characterType,
      mapKey: saveData.lastPosition?.mapKey || 'map1',
      timestamp: saveData.timestamp || Date.now(),
      totalExp: totalExp,
      level: level,
      slotIndex: saveData.slotIndex,
    };
  }

  /**
   * 슬롯 요약 데이터가 실제로 비어있는지 확인
   * @param {object | null} slotSummary - 슬롯 요약 데이터
   * @returns {boolean}
   */
  static isSlotReallyEmpty(slotSummary) {
    if (!slotSummary) return true;

    // ✅ mapKey가 있거나 경험치가 0보다 크면 플레이 이력이 있음
    const hasMapKey = !!slotSummary.mapKey;
    const hasExp = (slotSummary.totalExp || 0) > 0;
    const hasLevel = (slotSummary.level || 1) > 1;

    return !hasMapKey && !hasExp && !hasLevel;
  }

  static async loadAllSlots() {
    const slots = new Array(this.MAX_SLOTS).fill(null);

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const slotData = await this.load(i);
      const summary = this.extractSlotSummary(slotData);

      // ✅ 실제로 빈 슬롯인지 확인
      slots[i] = this.isSlotReallyEmpty(summary) ? null : summary;
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
      } else {
        console.error(`❌ 슬롯 ${slotIndex} 저장 실패`);
      }

      return result;
    } catch (err) {
      console.error(`❌ Error saving slot ${slotIndex}:`, err);
      return false;
    }
  }

  // ✅ 슬롯 선택 시 캐시 완전 초기화
  static async selectSlot(slotIndex, existingSlotData = null) {
    console.log(`🎯 슬롯 선택: ${slotIndex}, 기존 데이터: ${!!existingSlotData}`);

    const prevSlot = this.getCurrentSlot();

    // ✅ 이전 슬롯 백업
    if (prevSlot !== null && prevSlot !== slotIndex) {
      const prevData = await this.load(prevSlot);
      if (prevData) {
        await this.saveSlotData(prevSlot, prevData);
        console.log(`💾 이전 슬롯 ${prevSlot} 백업 완료`);
      }
    }

    // ✅ 캐시 완전 초기화 (중요!)
    this.clearCache();

    // ✅ 현재 활성 슬롯 업데이트
    this._cachedSlot = slotIndex;
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

      // ✅ 저장 확인 (캐시 강제 갱신)
      this.clearCache();
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
        this._cachedSlot = null;
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
    this._cachedSlot = null;
    this._cachedData = null;
    localStorage.removeItem(this.CURRENT_SLOT_KEY);
  }

  // === 나머지 메서드들 (변경 없음) ===
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

  static async getExpData() {
    const data = await this.load();
    if (!data) {
      return {
        totalExp: 0,
        characterExp: {},
        levelSystem: this.getDefaultSaveData().levelSystem,
      };
    }

    return {
      totalExp: data.levelSystem?.totalExperience || 0,
      characterExp: data.characterExp || {},
      levelSystem: data.levelSystem,
    };
  }

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
