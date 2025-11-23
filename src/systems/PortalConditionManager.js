import { KillTracker } from './KillTracker';
import { MAPS } from '../config/mapData';

// 포탈별 열림 조건 정의
export const PORTAL_CONDITIONS = {
  // ===== 기본 조건: 맵의 모든 몹 종류 각 20마리 =====

  // Other Cave → Scary Cave
  other_cave_to_scary_cave: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'other_cave',
  },

  // Scary Cave → Cave
  scary_cave_to_cave: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'scary_cave',
  },

  // Cave → Dark Cave
  cave_to_dark_cave: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'cave',
  },

  // Dark Cave → Forest
  dark_cave_to_forest: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'dark_cave',
  },

  // Forest → Oakwood
  forest_to_oakwood: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'forest',
  },

  // Oakwood → Temple Way
  oakwood_to_temple_way: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'oakwood',
  },

  // Temple Way → Temple 1
  temple_way_to_temple_1: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'temple_way',
  },

  // ===== 보스 처치 수 조건 =====

  // Temple 1 → Temple 2 (보스 2명 이상)
  temple_1_to_temple_2: {
    type: 'boss_count',
    requiredBossCount: 2,
    sourceMap: 'temple_1',
  },

  // Temple 2 → Temple 3 (보스 4명 이상)
  temple_2_to_temple_3: {
    type: 'boss_count',
    requiredBossCount: 4,
    sourceMap: 'temple_2',
  },

  // Temple 3 → Temple 4 (보스 6명 이상)
  temple_3_to_temple_4: {
    type: 'boss_count',
    requiredBossCount: 6,
    sourceMap: 'temple_3',
  },

  // ===== 레벨 조건 (순서 변경됨) =====

  // Temple 4 → Dark (총 레벨 60 이상)
  // 기존 Snow로 가던 조건을 Dark행으로 변경
  temple_4_to_dark: {
    type: 'total_level',
    requiredLevel: 60,
    sourceMap: 'temple_4',
  },

  // Dark → Final Map (각 캐릭터 40레벨 이상)
  // 조건 유지
  dark_to_final_map: {
    type: 'character_levels',
    requiredLevelPerCharacter: 40,
    sourceMap: 'dark',
  },

  // Final Map → Snow (각 캐릭터 50레벨 이상)
  // Snow가 마지막 맵이 되었으므로 가장 높은 난이도 조건 부여 (기존 10 -> 50 상향)
  final_map_to_snow: {
    type: 'character_levels',
    requiredLevelPerCharacter: 50,
    sourceMap: 'final_map',
  },
};

class PortalConditionManagerClass {
  constructor() {
    this.unlockedPortals = new Set(); // 열린 포탈 ID 저장
    this.defeatedBosses = new Set(); // 처치한 보스 ID
    this.listeners = [];

    // KillTracker 이벤트 구독
    KillTracker.addListener(this.onKillRecorded.bind(this));
  }

  /**
   * SaveSlotManager 동적 import (순환 참조 방지)
   */
  async getSaveSlotManager() {
    const { default: SaveSlotManager } = await import('../utils/SaveSlotManager.js');
    return SaveSlotManager;
  }

  /**
   * 킬 기록 시 호출 - 포탈 조건 체크
   */
  onKillRecorded(mapKey, enemyType, allKills) {
    this.checkMapPortals(mapKey);
  }

  /**
   * 특정 맵의 모든 포탈 조건 체크
   */
  async checkMapPortals(mapKey) {
    for (const [portalId, condition] of Object.entries(PORTAL_CONDITIONS)) {
      if (condition.sourceMap === mapKey && !this.unlockedPortals.has(portalId)) {
        if (await this.checkCondition(portalId, condition)) {
          this.unlockPortal(portalId);
        }
      }
    }
  }

  /**
   * 개별 조건 체크
   */
  async checkCondition(portalId, condition) {
    switch (condition.type) {
      case 'kill_count':
        return this.checkKillCondition(condition);

      case 'boss_count':
        return this.checkBossCountCondition(condition);

      case 'boss_defeat':
        return this.checkBossCondition(condition);

      case 'total_level':
        return await this.checkTotalLevelCondition(condition);

      case 'character_levels':
        return await this.checkCharacterLevelsCondition(condition);

      case 'custom':
        return this.checkCustomCondition(portalId, condition);

      default:
        return false;
    }
  }

  /**
   * 킬 카운트 조건 체크
   */
  checkKillCondition(condition) {
    const { sourceMap, requiredKills } = condition;
    const mapConfig = MAPS[sourceMap];

    if (!mapConfig?.enemies?.types) {
      console.warn(`No enemy types defined for map: ${sourceMap}`);
      return false;
    }

    const enemyTypes = mapConfig.enemies.types;
    const mapKills = KillTracker.getMapKills(sourceMap);

    // 모든 몹 종류가 requiredKills 이상인지 체크
    for (const enemyType of enemyTypes) {
      const normalizedKey = enemyType.toLowerCase();
      const kills = mapKills[normalizedKey] || 0;

      if (kills < requiredKills) {
        return false;
      }
    }

    return true;
  }

  /**
   * 보스 처치 수 조건 체크
   */
  checkBossCountCondition(condition) {
    const { requiredBossCount } = condition;
    const currentBossCount = this.defeatedBosses.size;
    return currentBossCount >= requiredBossCount;
  }

  /**
   * 특정 보스 처치 조건 체크
   */
  checkBossCondition(condition) {
    if (!condition.bossId) return false;
    return this.defeatedBosses.has(condition.bossId);
  }

  /**
   * 총 레벨 조건 체크 (NEW)
   */
  async checkTotalLevelCondition(condition) {
    try {
      const SaveSlotManager = await this.getSaveSlotManager();
      const levelSystem = await SaveSlotManager.getLevelSystem();

      const currentLevel = levelSystem?.level || 1;
      return currentLevel >= condition.requiredLevel;
    } catch (error) {
      console.error('총 레벨 체크 실패:', error);
      return false;
    }
  }

  /**
   * 각 캐릭터 레벨 조건 체크 (NEW)
   */
  async checkCharacterLevelsCondition(condition) {
    try {
      const SaveSlotManager = await this.getSaveSlotManager();
      const saveData = await SaveSlotManager.load();

      if (!saveData?.characterExp) {
        return false;
      }

      const { requiredLevelPerCharacter } = condition;
      const characterExp = saveData.characterExp;

      // 모든 캐릭터가 해당 레벨 이상인지 체크
      // 캐릭터 목록은 CharacterData에서 가져오거나 하드코딩
      const characterTypes = Object.keys(characterExp);

      if (characterTypes.length === 0) {
        return false;
      }

      // 각 캐릭터의 경험치를 레벨로 변환하여 체크
      for (const charType of characterTypes) {
        const exp = characterExp[charType] || 0;
        const level = this.calculateLevelFromExp(exp);

        if (level < requiredLevelPerCharacter) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('캐릭터 레벨 체크 실패:', error);
      return false;
    }
  }

  /**
   * 경험치로부터 레벨 계산 (LevelSystem과 동일한 로직)
   */
  calculateLevelFromExp(totalExp) {
    let level = 1;
    let accumulated = 0;
    let required = 100;

    while (accumulated + required <= totalExp) {
      accumulated += required;
      level++;

      // 10레벨마다 1.5배, 그 외는 1.1배
      if (level % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
    }

    return level;
  }

  /**
   * 커스텀 조건 체크
   */
  checkCustomCondition(portalId, condition) {
    // 퀘스트, 아이템 등 특수 조건
    return false;
  }

  /**
   * 포탈 열기
   */
  unlockPortal(portalId) {
    this.unlockedPortals.add(portalId);
    // 리스너들에게 알림 (UI 업데이트, 이펙트 등)
    this.notifyListeners('portal_unlocked', portalId);
  }

  /**
   * 보스 처치 기록 (외부에서 호출)
   */
  async recordBossDefeat(bossId) {
    this.defeatedBosses.add(bossId);

    // 저장소에도 즉시 동기화
    const { default: SaveSlotManager } = await import('../utils/SaveSlotManager.js');
    const saveData = await SaveSlotManager.load();
    if (saveData) {
      saveData.clearedBosses = [...this.defeatedBosses];
      await SaveSlotManager.save(saveData);
    }

    // 모든 포탈 조건 재검사
    await this.revalidateAllPortals();
  }
  /**
   * 포탈이 열렸는지 확인
   */
  isPortalUnlocked(portalId) {
    // 뒤로 가는 포탈(from_xxx)은 항상 열림
    if (portalId.includes('_from_')) {
      return true;
    }
    return this.unlockedPortals.has(portalId);
  }

  /**
   * 포탈 진행도 조회 (UI 표시용)
   */
  async getPortalProgress(portalId) {
    const condition = PORTAL_CONDITIONS[portalId];
    if (!condition) return null;

    // 킬 카운트 조건
    if (condition.type === 'kill_count') {
      const mapConfig = MAPS[condition.sourceMap];
      if (!mapConfig?.enemies?.types) return null;

      const enemyTypes = mapConfig.enemies.types;
      const mapKills = KillTracker.getMapKills(condition.sourceMap);
      const required = condition.requiredKills;

      const progress = enemyTypes.map((type) => {
        const normalizedKey = type.toLowerCase();
        const current = mapKills[normalizedKey] || 0;

        return {
          enemyType: type,
          displayName: normalizedKey,
          current,
          required,
          completed: current >= required,
        };
      });

      return {
        type: 'kill_count',
        progress,
        isComplete: progress.every((p) => p.completed),
      };
    }

    // 보스 카운트 조건
    if (condition.type === 'boss_count') {
      const current = this.defeatedBosses.size;
      const required = condition.requiredBossCount;

      return {
        type: 'boss_count',
        current,
        required,
        isComplete: current >= required,
      };
    }

    // 특정 보스 처치 조건
    if (condition.type === 'boss_defeat') {
      return {
        type: 'boss_defeat',
        bossId: condition.bossId,
        isComplete: this.defeatedBosses.has(condition.bossId),
      };
    }

    // 총 레벨 조건
    if (condition.type === 'total_level') {
      try {
        const SaveSlotManager = await this.getSaveSlotManager();
        const levelSystem = await SaveSlotManager.getLevelSystem();
        const currentLevel = levelSystem?.level || 1;
        const required = condition.requiredLevel;

        return {
          type: 'total_level',
          current: currentLevel,
          required,
          isComplete: currentLevel >= required,
        };
      } catch (error) {
        console.error('총 레벨 진행도 조회 실패:', error);
        return null;
      }
    }

    // 각 캐릭터 레벨 조건
    if (condition.type === 'character_levels') {
      try {
        const SaveSlotManager = await this.getSaveSlotManager();
        const saveData = await SaveSlotManager.load();
        const characterExp = saveData?.characterExp || {};
        const required = condition.requiredLevelPerCharacter;

        const characterProgress = Object.entries(characterExp).map(([charType, exp]) => {
          const level = this.calculateLevelFromExp(exp);
          return {
            characterType: charType,
            level,
            required,
            completed: level >= required,
          };
        });

        return {
          type: 'character_levels',
          progress: characterProgress,
          isComplete: characterProgress.every((p) => p.completed),
        };
      } catch (error) {
        console.error('캐릭터 레벨 진행도 조회 실패:', error);
        return null;
      }
    }

    return null;
  }

  // === 리스너 관리 ===
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((cb) => cb(event, data));
  }

  // === 저장/불러오기 ===
  serialize() {
    return JSON.stringify({
      unlockedPortals: [...this.unlockedPortals],
      defeatedBosses: [...this.defeatedBosses],
    });
  }

  deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      this.unlockedPortals = new Set(parsed.unlockedPortals || []);
      this.defeatedBosses = new Set(parsed.defeatedBosses || []);
    } catch (e) {
      console.error('Failed to load portal data:', e);
    }
  }
  /**
   * 모든 포탈 조건 재검사
   */
  async revalidateAllPortals() {
    for (const [portalId, condition] of Object.entries(PORTAL_CONDITIONS)) {
      // 이미 열린 포탈은 스킵
      if (this.unlockedPortals.has(portalId)) {
        continue;
      }

      // 조건 체크 (async 지원)
      if (await this.checkCondition(portalId, condition)) {
        this.unlockPortal(portalId);
      }
    }
  }

  reset() {
    this.unlockedPortals.clear();
    this.defeatedBosses.clear();
  }
}

export const PortalConditionManager = new PortalConditionManagerClass();
