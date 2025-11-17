// utils/SaveSlotManager.js (SaveManager 기능 통합 완료)

import { CharacterData } from '../config/characterData';
// CharacterData는 SaveManager에서 사용되었으므로 그대로 import 유지

// 통합된 SaveSlotManager는 인스턴스 패턴을 사용하지 않고 Static 메서드를 유지하여
// 기존 SaveManager의 정적 호출 방식을 이어받았습니다.

export default class SaveSlotManager {
  // --- 1. 상수 (기존 SaveManager 및 SaveSlotManager 상수 통합) ---
  static SLOT_PREFIX = 'save_slot_';
  static CURRENT_SLOT_KEY = 'current_slot';
  static MAX_SLOTS = 3;

  // --- 2. 기본 유틸리티 함수 (기존 SaveManager에서 가져옴) ---

  /** Electron 환경인지 확인 */
  static isElectron() {
    return typeof window !== 'undefined' && window.electron;
  }

  /** 현재 활성 슬롯 인덱스 가져오기 */
  static getCurrentSlot() {
    const v = localStorage.getItem(this.CURRENT_SLOT_KEY);
    // 기본값은 0번 슬롯
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

  // --- 3. 핵심 저장/로드 로직 (기존 SaveManager의 save, load, clear 통합) ---

  /** 세이브 데이터 로드 (SaveManager.load 역할) */
  static async load(slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      let data = null;

      if (this.isElectron()) {
        // Electron 환경 로드
        data = await window.electron.loadSave(targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          const storedSlot = localStorage.getItem(`${this.SLOT_PREFIX}${targetSlotIndex}`);
          data = storedSlot ? JSON.parse(storedSlot) : null;
        } else {
          console.error(`❌ Load error: Invalid target slot index: ${targetSlotIndex}`);
          // 유효하지 않은 인덱스면 null 반환 (빈 슬롯으로 처리하도록)
          return null;
        }
      }

      // 데이터가 없으면 null 반환 (isSlotEmpty 및 UI 처리를 위해)
      // 데이터가 있으면 기본값과 병합하여 완전한 구조 보장
      return data ? { ...this.getDefaultSaveData(), ...data } : null;
    } catch (error) {
      console.error('❌ Save load error:', error);
      return null; // 로드 실패 시 null 반환
    }
  }

  /** 세이브 (SaveManager.save 역할) */
  static async save(data, slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    try {
      // timestamp를 명시적으로 업데이트
      const dataToSave = { ...data, timestamp: Date.now() };

      if (this.isElectron()) {
        await window.electron.saveSave(dataToSave, targetSlotIndex);
      } else {
        if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
          localStorage.setItem(`${this.SLOT_PREFIX}${targetSlotIndex}`, JSON.stringify(dataToSave));
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

  /** 슬롯 데이터 삭제 (SaveManager.clear 역할) */
  static async clear(slotIndex = null) {
    const targetSlotIndex = slotIndex !== null ? slotIndex : this.getCurrentSlot();

    if (this.isElectron()) {
      await window.electron.clearSave(targetSlotIndex);
    } else {
      if (targetSlotIndex >= 0 && targetSlotIndex < this.MAX_SLOTS) {
        localStorage.removeItem(`${this.SLOT_PREFIX}${targetSlotIndex}`);
      }
    }
  }

  // --- 4. 슬롯 관리 기능 (기존 SaveSlotManager의 기능) ---

  /** 슬롯 요약 정보 추출 */
  static extractSlotSummary(saveData) {
    if (!saveData) return null;

    const characterType =
      saveData.currentCharacter || saveData.lastPosition?.characterType || 'soul';

    return {
      characterType,
      mapKey: saveData.lastPosition?.mapKey || 'map1',
      timestamp: saveData.timestamp || Date.now(),
      totalExp: saveData.totalExp || 0,
      slotIndex: saveData.slotIndex,
    };
  }

  /** 모든 슬롯의 요약 정보 로드 (MainMenuScene에서 사용) */
  static async loadAllSlots() {
    const slots = new Array(this.MAX_SLOTS).fill(null);

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      // 통합된 this.load 사용. 데이터가 없으면 null 반환
      const slotData = await this.load(i);
      slots[i] = slotData ? this.extractSlotSummary(slotData) : null;
    }

    return slots;
  }

  /** 특정 슬롯의 전체 데이터 로드 (loadSlotData 역할) */
  static async loadSlotData(slotIndex) {
    try {
      // 통합된 this.load 사용. 데이터가 없으면 null 반환
      const data = await this.load(slotIndex);
      return data || null;
    } catch (err) {
      console.error(`Error loading slot ${slotIndex}:`, err);
      return null;
    }
  }

  /** 특정 슬롯에 데이터 저장 (saveSlotData 역할) */
  static async saveSlotData(slotIndex, data) {
    try {
      const characterType = data.currentCharacter || data.lastPosition?.characterType || 'soul';
      const payload = {
        ...data,
        slotIndex,
        currentCharacter: characterType,
        timestamp: Date.now(),
      };

      if (payload.lastPosition) payload.lastPosition.characterType = characterType;

      // 통합된 this.save 사용
      await this.save(payload, slotIndex);
      return true;
    } catch (err) {
      console.error(`Error saving slot ${slotIndex}:`, err);
      return false;
    }
  }

  /** 슬롯 선택 (selectSlot 역할) */
  static async selectSlot(slotIndex, existingSlotData = null) {
    const prevSlot = this.getCurrentSlot();

    // 이전 슬롯 백업 (현재 로드된 데이터를 이전 슬롯에 저장)
    if (prevSlot !== null && prevSlot !== slotIndex) {
      // 이전 슬롯의 데이터를 다시 로드해서 백업하는 것은 비효율적일 수 있습니다.
      // 여기서는 'SaveManager.load(prevSlot)' 대신 현재 활성 상태의 데이터를 사용해야 하지만,
      // 현재 클래스는 '활성 데이터'를 정적 변수로 가지고 있지 않으므로
      // SaveManager가 하던 방식(saveManager.js의 save()에서 현재 활성 슬롯을 저장하는 방식)을 따라야 합니다.
      // 여기서는 원본 코드의 로직을 유지하면서 `this.load`와 `this.saveSlotData`를 사용합니다.
      const prevData = await this.load(prevSlot);
      if (prevData) await this.saveSlotData(prevSlot, prevData);
    }

    // 현재 활성 슬롯 인덱스 업데이트
    localStorage.setItem(this.CURRENT_SLOT_KEY, String(slotIndex));

    if (existingSlotData) {
      // 기존 게임 로드: 슬롯 데이터 로드 후, 현재 활성 슬롯에 해당 데이터로 다시 저장
      const fullData = await this.loadSlotData(slotIndex);
      if (fullData) {
        // 통합된 this.saveSlotData를 사용하여 현재 슬롯(slotIndex)에 데이터 설정
        await this.saveSlotData(slotIndex, fullData);
      }
      return;
    }

    // 새 게임 시작: 기본 데이터 생성 후 현재 슬롯에 저장
    const newData = this.getDefaultSaveData();
    newData.slotIndex = slotIndex;
    newData.currentCharacter = 'soul';
    newData.timestamp = Date.now();

    await this.saveSlotData(slotIndex, newData);
  }

  /** 현재 슬롯의 데이터 백업 (backupCurrentSlot 역할) */
  static async backupCurrentSlot() {
    const slot = this.getCurrentSlot();
    const data = await this.load(slot);
    if (data) await this.saveSlotData(slot, data);
  }

  /** 즉시 백업 (immediateBackup 역할) */
  static async immediateBackup() {
    await this.backupCurrentSlot();
  }

  /** 슬롯 데이터 삭제 (deleteSlot 역할) */
  static async deleteSlot(slotIndex) {
    try {
      await this.clear(slotIndex); // 통합된 this.clear 사용
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

  /** 슬롯이 비어있는지 확인 (isSlotEmpty 역할) */
  static async isSlotEmpty(slotIndex) {
    const data = await this.loadSlotData(slotIndex);
    return data === null; // this.load가 데이터 없으면 null을 반환하도록 수정되었으므로 가능
  }

  /** 모든 슬롯 초기화 (clearAllSlots 역할) */
  static async clearAllSlots() {
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      await this.clear(i); // 통합된 this.clear 사용
    }
    localStorage.removeItem(this.CURRENT_SLOT_KEY);
  }

  // --- 5. 게임 데이터 접근 및 업데이트 (기존 SaveManager의 세부 기능 통합) ---

  /** 현재 캐릭터 업데이트 (updateCurrentCharacter 역할) */
  static async updateCurrentCharacter(characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
    saveData.currentCharacter = characterType;
    if (saveData.lastPosition) saveData.lastPosition.characterType = characterType;
    return await this.save(saveData, saveData.slotIndex);
  }

  /** 현재 캐릭터 가져오기 (getCurrentCharacter 역할) */
  static async getCurrentCharacter() {
    const saveData = await this.load();
    if (!saveData) return 'soul';
    return saveData.lastPosition?.characterType || saveData.currentCharacter || 'soul';
  }

  /** 위치 저장 (savePosition 역할) */
  static async savePosition(mapKey, x, y, characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
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

  /** 포털 위치 저장 (savePortalPosition 역할) */
  static async savePortalPosition(targetMapKey, portalId, characterType) {
    const saveData = await this.load();
    if (!saveData) return false;
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

  /** 저장된 위치 가져오기 (getSavedPosition 역할) */
  static async getSavedPosition() {
    const saveData = await this.load();
    if (!saveData) return null;
    return saveData.lastPosition || null;
  }

  /** 캐릭터 상태 저장 (saveCharacterState 역할) */
  static async saveCharacterState(characterType, state) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.characters) saveData.characters = {};
    saveData.characters[characterType] = {
      ...saveData.characters[characterType],
      ...state,
      timestamp: Date.now(),
    };
    if (state.gainedExp) saveData.totalExp = (saveData.totalExp || 0) + state.gainedExp;
    return await this.save(saveData, saveData.slotIndex);
  }

  /** 캐릭터 상태 가져오기 (getCharacterState 역할) */
  static async getCharacterState(characterType) {
    const saveData = await this.load();
    return saveData?.characters?.[characterType] || null;
  }

  /** 캐릭터 리소스 저장 (saveCharacterResources 역할) */
  static async saveCharacterResources(characterType, hp, mp) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.characters) saveData.characters = {};
    if (!saveData.characters[characterType]) saveData.characters[characterType] = {};
    saveData.characters[characterType].hp = hp;
    saveData.characters[characterType].mp = mp;
    saveData.characters[characterType].timestamp = Date.now();
    return await this.save(saveData, saveData.slotIndex);
  }

  /** 캐릭터 리소스 가져오기 (getCharacterResources 역할) */
  static async getCharacterResources(characterType) {
    const state = await this.getCharacterState(characterType);
    if (state && state.hp !== undefined && state.mp !== undefined) {
      return { hp: state.hp, mp: state.mp };
    }
    return null;
  }

  /** 경험치 추가 (addExp 역할) */
  static async addExp(amount, characterType) {
    if (amount <= 0) return;
    const data = await this.load();
    if (!data) return false;

    data.totalExp = (data.totalExp || 0) + amount;
    data.characterExp = data.characterExp || {};
    data.characterExp[characterType] = (data.characterExp[characterType] || 0) + amount;

    // 캐릭터 상태에도 EXP 업데이트
    if (!data.characters) data.characters = {};
    if (!data.characters[characterType]) data.characters[characterType] = {};
    data.characters[characterType].exp = data.characterExp[characterType];

    await this.save(data, data.slotIndex);
    return { characterExp: data.characterExp[characterType], totalExp: data.totalExp };
  }

  /** 경험치 데이터 가져오기 (getExpData 역할) */
  static async getExpData() {
    const data = await this.load();
    if (!data) return { totalExp: 0, characterExp: {} };
    return { totalExp: data.totalExp || 0, characterExp: data.characterExp || {} };
  }

  /** 스킬 쿨타임 저장 (saveSkillCooldown 역할) */
  static async saveSkillCooldown(characterType, skillKey, cooldownEndTime) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    if (!saveData.skillCooldowns[characterType]) saveData.skillCooldowns[characterType] = {};
    saveData.skillCooldowns[characterType][skillKey] = cooldownEndTime;
    await this.save(saveData, saveData.slotIndex);
  }

  /** 모든 스킬 쿨타임 저장 (saveAllSkillCooldowns 역할) */
  static async saveAllSkillCooldowns(characterType, cooldowns) {
    const saveData = await this.load();
    if (!saveData) return false;
    if (!saveData.skillCooldowns) saveData.skillCooldowns = {};
    saveData.skillCooldowns[characterType] = cooldowns;
    await this.save(saveData, saveData.slotIndex);
  }

  /** 스킬 쿨타임 가져오기 (getSkillCooldowns 역할) */
  static async getSkillCooldowns(characterType) {
    const saveData = await this.load();
    return saveData?.skillCooldowns?.[characterType] || {};
  }

  /** 남은 쿨타임 가져오기 (getRemainingCooldown 역할) */
  static async getRemainingCooldown(characterType, skillKey) {
    const cooldowns = await this.getSkillCooldowns(characterType);
    const remaining = (cooldowns[skillKey] || 0) - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /** 만료된 쿨타임 정리 (cleanExpiredCooldowns 역할) */
  static async cleanExpiredCooldowns(characterType) {
    const saveData = await this.load();
    if (!saveData) return;
    const now = Date.now();
    const cooldowns = saveData?.skillCooldowns?.[characterType] || {};

    // 만료된 쿨타임 삭제
    Object.keys(cooldowns).forEach((key) => {
      if (cooldowns[key] <= now) delete cooldowns[key];
    });

    // 변경 사항 저장
    await this.save(saveData, saveData.slotIndex);
  }
}
