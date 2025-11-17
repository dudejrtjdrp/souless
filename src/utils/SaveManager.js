// utils/SaveManager.js
// Electron + Vite 환경 + 기존 기능 모두 포함

import { CharacterData } from '../config/characterData';

export default class SaveManager {
  static MAX_SLOTS = 3; // 슬롯 최대 개수
  static CURRENT_SLOT_KEY = 'current_slot'; // 현재 활성 슬롯을 확인하기 위해 추가

  /** Electron 환경인지 확인 */
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  /** 현재 활성 슬롯 인덱스 가져오기 (SaveSlotManager와 동일) */
  static getCurrentSlot() {
    const v = localStorage.getItem(this.CURRENT_SLOT_KEY);
    return v !== null ? parseInt(v, 10) : 0;
  }

  /** 기본 세이브 데이터 */
  static getDefaultSaveData() {
    return {
      totalExp: 0,
      characterExp: {},
      characters: {}, // 캐릭터 상태
      skillCooldowns: {}, // 스킬 쿨타임
      lastPosition: null, // 마지막 위치
      currentCharacter: 'soul',
      slotIndex: null,
      timestamp: Date.now(),
    };
  }

  /** 세이브 데이터 로드 */
  static async load(slotIndex = null) {
    // slotIndex가 주어지지 않으면 현재 활성 슬롯을 사용하도록 강제
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      let data = null;

      if (this.isElectron()) {
        data = await window.electron.loadSave(targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          const storedSlot = localStorage.getItem(`save_slot_${targetSlotIndex}`);
          data = storedSlot ? JSON.parse(storedSlot) : null;
        } else {
          console.error(`❌ Save load error: Invalid target slot index: ${targetSlotIndex}`);
          return this.getDefaultSaveData();
        }
      }

      return data ? { ...this.getDefaultSaveData(), ...data } : this.getDefaultSaveData();
    } catch (error) {
      console.error('❌ Save load error:', error);
      return this.getDefaultSaveData();
    }
  }

  static async loadAllSlots() {
    const slots = [];
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const slotData = await this.load(i);
      slots.push(slotData);
    }
    return slots;
  }

  /** 세이브 */
  static async save(data, slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      const dataToSave = { ...data, timestamp: Date.now() };

      if (this.isElectron()) {
        await window.electron.saveSave(dataToSave, targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          // 오직 save_slot_X 키만 사용합니다.
          localStorage.setItem(`save_slot_${targetSlotIndex}`, JSON.stringify(dataToSave));
          console.log(
            `💾 Saved to slot ${targetSlotIndex} (character: ${dataToSave.currentCharacter})`,
          );
        } else {
          console.error(
            `❌ Save error: Attempted save with invalid slot index: ${targetSlotIndex}`,
          );
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

    if (this.isElectron()) {
      await window.electron.clearSave(targetSlotIndex);
    } else {
      if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
        localStorage.removeItem(`save_slot_${targetSlotIndex}`);
      }
    }
  }

  static async updateCurrentCharacter(characterType) {
    const saveData = await this.load();
    saveData.currentCharacter = characterType;
    if (saveData.lastPosition) saveData.lastPosition.characterType = characterType;
    return await this.save(saveData, saveData.slotIndex);
  }

  static async getCurrentCharacter() {
    const saveData = await this.load();
    return saveData.lastPosition?.characterType || saveData.currentCharacter || 'soul';
  }

  static async savePosition(mapKey, x, y, characterType) {
    const saveData = await this.load();
    saveData.currentCharacter = characterType;
    saveData.lastPosition = {
      mapKey,
      x,
      y,
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: false,
      isPortalSpawn: false,
      timestamp: Date.now(),
    };
    return await this.save(saveData, saveData.slotIndex);
  }

  static async savePortalPosition(targetMapKey, portalId, characterType) {
    const saveData = await this.load();
    saveData.currentCharacter = characterType;
    saveData.lastPosition = {
      mapKey: targetMapKey,
      portalId,
      characterType,
      physics: CharacterData[characterType].physics.collisionBox,
      fromPortal: true,
      isPortalSpawn: true,
      timestamp: Date.now(),
    };
    return await this.save(saveData, saveData.slotIndex);
  }

  static async getSavedPosition() {
    const saveData = await this.load();
    return saveData.lastPosition || null;
  }

  static async saveCharacterState(characterType, state) {
    const saveData = await this.load();
    if (!saveData.characters) saveData.characters = {};
    saveData.characters[characterType] = {
      ...saveData.characters[characterType],
      ...state,
      timestamp: Date.now(),
    };
    if (state.gainedExp) saveData.totalExp = (saveData.totalExp || 0) + state.gainedExp;
    return await this.save(saveData, saveData.slotIndex);
  }

  static async getCharacterState(characterType) {
    const saveData = await this.load();
    return saveData?.characters?.[characterType] || null;
  }

  static async saveCharacterResources(characterType, hp, mp) {
    const saveData = await this.load();
    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};
    saveData.characters[characterType].hp = hp;
    saveData.characters[characterType].mp = mp;
    saveData.characters[characterType].timestamp = Date.now();
    return await this.save(saveData, saveData.slotIndex);
  }

  static async getCharacterResources(characterType) {
    const state = await this.getCharacterState(characterType);
    if (state && state.hp !== undefined && state.mp !== undefined) {
      return { hp: state.hp, mp: state.mp };
    }
    return null;
  }

  static async addExp(amount, characterType) {
    if (amount <= 0) return;
    const data = await this.load();
    data.totalExp = (data.totalExp || 0) + amount;
    data.characterExp = data.characterExp || {};
    data.characterExp[characterType] = (data.characterExp[characterType] || 0) + amount;
    if (!data.characters) data.characters = {};
    if (!data.characters[characterType]) data.characters[characterType] = {};
    data.characters[characterType].exp = data.characterExp[characterType];
    await this.save(data, data.slotIndex);
    return { characterExp: data.characterExp[characterType], totalExp: data.totalExp };
  }

  static async getExpData() {
    const data = await this.load();
    return { totalExp: data.totalExp || 0, characterExp: data.characterExp || {} };
  }

  static async saveSkillCooldown(characterType, skillKey, cooldownEndTime) {
    const saveData = await this.load();
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    if (!saveData.skillCooldowns[characterType]) saveData.skillCooldowns[characterType] = {};
    saveData.skillCooldowns[characterType][skillKey] = cooldownEndTime;
    await this.save(saveData, saveData.slotIndex);
  }

  static async saveAllSkillCooldowns(characterType, cooldowns) {
    const saveData = await this.load();
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    saveData.skillCooldowns[characterType] = cooldowns;
    await this.save(saveData, saveData.slotIndex);
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
    const now = Date.now();
    const cooldowns = saveData?.skillCooldowns?.[characterType] || {};
    Object.keys(cooldowns).forEach((key) => {
      if (cooldowns[key] <= now) delete cooldowns[key];
    });
    await this.save(saveData, saveData.slotIndex);
  }
}
