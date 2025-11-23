import { CharacterData } from '../config/characterData';
import { KillTracker } from '../systems/KillTracker';
import { PortalConditionManager } from '../systems/PortalConditionManager';

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
      killTracker: '{}',
      portalConditions: '{"unlockedPortals":[],"defeatedBosses":[]}',
    };
  }

  static clearCache() {
    this._cachedData = null;
  }

  // === 핵심 저장/로드 ===
  static async load(slotIndex = null) {
    const targetSlot = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    if (this._cachedData && this._cachedData.slotIndex === targetSlot) {
      return this._cachedData;
    }

    try {
      let data = null;

      if (this.isElectron()) {
        data = await window.electron.loadSave(targetSlot);
      } else {
        if (targetSlot >= 0 && targetSlot < this.MAX_SLOTS) {
          const storedSlot = localStorage.getItem(`${this.SLOT_PREFIX}${targetSlot}`);
          data = storedSlot ? JSON.parse(storedSlot) : null;
        } else {
          return null;
        }
      }

      if (data) {
        this._cachedData = { ...this.getDefaultSaveData(), ...data };
        return this._cachedData;
      }

      return null;
    } catch (error) {
      console.error('Load error:', error);
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

    this._cachedData = dataToSave;
    this._saveQueue.push({ data: dataToSave, slot: targetSlot });

    if (!this._isSaving) {
      this.processSaveQueue();
    }

    return true;
  }

  static async processSaveQueue() {
    if (this._saveQueue.length === 0) {
      this._isSaving = false;
      return;
    }

    this._isSaving = true;
    const lastSave = this._saveQueue[this._saveQueue.length - 1];
    this._saveQueue = [];

    try {
      if (this.isElectron()) {
        await window.electron.saveSave(lastSave.data, lastSave.slot);
      } else {
        localStorage.setItem(`${this.SLOT_PREFIX}${lastSave.slot}`, JSON.stringify(lastSave.data));
      }
    } catch (error) {
      console.error('Save error:', error);
    }

    if (this._saveQueue.length > 0) {
      setTimeout(() => this.processSaveQueue(), 0);
    } else {
      this._isSaving = false;
    }
  }

  // ============================================
  // 킬/포탈 데이터 저장/불러오기 (새로 추가)
  // ============================================

  /**
   * 킬 트래커 및 포탈 조건 데이터 저장
   */
  static async saveKillData(KillTracker, PortalConditionManager) {
    const currentSlot = this.getCurrentSlot();
    let saveData = await this.load(currentSlot);

    if (!saveData) {
      saveData = this.getDefaultSaveData();
    }

    saveData.killTracker = KillTracker.serialize();
    saveData.portalConditions = PortalConditionManager.serialize();

    // 중요: defeatedBosses → clearedBosses 동기화 (배열로 저장)
    saveData.clearedBosses = [...PortalConditionManager.defeatedBosses];

    await this.save(saveData, currentSlot);
  }

  /**
   * 킬 트래커 및 포탈 조건 데이터 불러오기
   */
  static async loadKillData(KillTracker, PortalConditionManager) {
    const currentSlot = this.getCurrentSlot();
    const saveData = await this.load(currentSlot);

    if (saveData?.killTracker) {
      KillTracker.deserialize(saveData.killTracker);
    }

    if (saveData?.portalConditions) {
      PortalConditionManager.deserialize(saveData.portalConditions);
    }

    // 중요: clearedBosses → defeatedBosses 동기화
    if (saveData?.clearedBosses && Array.isArray(saveData.clearedBosses)) {
      saveData.clearedBosses.forEach((bossId) => {
        PortalConditionManager.defeatedBosses.add(bossId);
      });
    }
  }

  /**
   * 킬/포탈 데이터 리셋
   */
  static resetKillData(KillTracker, PortalConditionManager) {
    KillTracker.reset();
    PortalConditionManager.reset();
  }

  // ============================================
  // 기존 메서드들 (변경 없음)
  // ============================================

  static async clear(slotIndex = null) {
    const targetSlot = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      if (this.isElectron()) {
        await window.electron.clearSave(targetSlot);
      } else {
        if (targetSlot >= 0 && targetSlot < this.MAX_SLOTS) {
          localStorage.removeItem(`${this.SLOT_PREFIX}${targetSlot}`);
        }
      }

      if (this._cachedData?.slotIndex === targetSlot) {
        this._cachedData = null;
      }
    } catch (error) {
      console.error('Clear error:', error);
    }
  }

  static extractSlotSummary(saveData) {
    if (!saveData) return null;

    const characterType =
      saveData.currentCharacter || saveData.lastPosition?.characterType || 'soul';
    const totalExp = saveData.levelSystem?.totalExperience || 0;
    const level = saveData.levelSystem?.level || 1;

    return {
      characterType,
      currentCharacter: saveData.currentCharacter || 'soul',
      mapKey: saveData.lastPosition?.mapKey || 'map1',
      timestamp: saveData.timestamp || Date.now(),
      totalExp,
      level,
      slotIndex: saveData.slotIndex,

      // 클리어 퍼센트 계산에 필요한 데이터 추가
      clearedBosses: saveData.clearedBosses || [],
      levelSystem: saveData.levelSystem || {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
        characterLevels: {},
      },
    };
  }

  static isSlotReallyEmpty(slotSummary) {
    if (!slotSummary) return true;
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
      slots[i] = this.isSlotReallyEmpty(summary) ? null : summary;
    }

    return slots;
  }

  static async loadSlotData(slotIndex) {
    try {
      return await this.load(slotIndex);
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

      return await this.save(payload, slotIndex);
    } catch (err) {
      console.error(`Error saving slot ${slotIndex}:`, err);
      return false;
    }
  }

  static async selectSlot(slotIndex, existingSlotData = null) {
    const prevSlot = this.getCurrentSlot();

    if (prevSlot !== null && prevSlot !== slotIndex) {
      const prevData = await this.load(prevSlot);
      if (prevData) {
        await this.saveSlotData(prevSlot, prevData);
      }
    }

    this.clearCache();

    const { KillTracker } = await import('../systems/KillTracker');
    const { PortalConditionManager } = await import('../systems/PortalConditionManager');
    this.resetKillData(KillTracker, PortalConditionManager);

    this._cachedSlot = slotIndex;
    localStorage.setItem(this.CURRENT_SLOT_KEY, String(slotIndex));

    if (existingSlotData) {
      const fullData = await this.loadSlotData(slotIndex);
      if (fullData) {
        // 킬/포탈 데이터 로드 (clearedBosses 동기화 포함)
        await this.loadKillData(KillTracker, PortalConditionManager);

        // 포탈 조건 재검사
        await PortalConditionManager.revalidateAllPortals();
        return;
      }
    }

    const newData = this.getDefaultSaveData();
    newData.slotIndex = slotIndex;
    newData.currentCharacter = 'soul';
    newData.timestamp = Date.now();
    newData.clearedBosses = [];

    await this.saveSlotData(slotIndex, newData);

    this.clearCache();
    await this.load(slotIndex);
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

    const { KillTracker } = await import('../systems/KillTracker');
    const { PortalConditionManager } = await import('../systems/PortalConditionManager');
    this.resetKillData(KillTracker, PortalConditionManager);
  }

  // === Position/Character 관련 ===
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
    return saveData?.lastPosition?.characterType || saveData?.currentCharacter || 'soul';
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
    return saveData?.lastPosition || null;
  }

  // === Character State ===
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

  static async saveCharacterResources(characterType, hp, mp, stats = null) {
    const saveData = await this.load();
    if (!saveData) return false;

    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};

    saveData.characters[characterType].hp = hp;
    saveData.characters[characterType].mp = mp;

    // 스탯 저장
    if (stats) {
      saveData.characters[characterType].stats = {
        strength: stats.strength,
        defense: stats.defense,
        maxHealth: stats.maxHealth,
        maxMana: stats.maxMana,
      };
    }

    saveData.characters[characterType].timestamp = Date.now();
    return await this.save(saveData);
  }

  static async getCharacterResources(characterType) {
    const state = await this.getCharacterState(characterType);
    if (state && state.hp !== undefined && state.mp !== undefined) {
      return {
        hp: state.hp,
        mp: state.mp,
        stats: state.stats || null, // 스탯도 반환
      };
    }
    return null;
  }

  // 새 메서드: 스탯만 저장
  static async saveCharacterStats(characterType, stats) {
    const saveData = await this.load();
    if (!saveData) return false;

    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};

    saveData.characters[characterType].stats = {
      strength: stats.strength,
      defense: stats.defense,
      maxHealth: stats.maxHealth,
      maxMana: stats.maxMana,
    };

    saveData.characters[characterType].timestamp = Date.now();
    return await this.save(saveData);
  }

  static async getCharacterStats(characterType) {
    const state = await this.getCharacterState(characterType);
    return state?.stats || null;
  }

  static async getAllCharacterStats() {
    const saveData = await this.load();
    if (!saveData?.characters) return {};

    const allStats = {};
    for (const [charType, charData] of Object.entries(saveData.characters)) {
      if (charData.stats) {
        allStats[charType] = charData.stats;
      }
    }
    return allStats;
  }

  // Level System
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
    return (
      saveData?.levelSystem || {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
      }
    );
  }

  // === Skill Cooldowns ===
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
