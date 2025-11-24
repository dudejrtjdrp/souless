import { KillTracker } from './KillTracker';
import { MAPS } from '../config/mapData';

// 포탈별 열림 조건 정의
export const PORTAL_CONDITIONS = {
  // ===== 기본 조건: 맵의 모든 몹 종류 각 20마리 =====

  // Other Cave → Scary Cave
  other_cave_to_scary_cave: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'other_cave',
  },

  // Scary Cave → Cave
  scary_cave_to_cave: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'scary_cave',
  },

  // Cave → Dark Cave
  cave_to_dark_cave: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'cave',
  },

  // Dark Cave → Forest
  dark_cave_to_forest: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'dark_cave',
  },

  // Forest → Oakwood
  forest_to_oakwood: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'forest',
  },

  // Oakwood → Temple Way
  oakwood_to_temple_way: {
    type: 'kill_count',
    requiredKills: 10,
    sourceMap: 'oakwood',
  },

  // Temple Way → Temple 1
  temple_way_to_temple_1: {
    type: 'kill_count',
    requiredKills: 10,
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

  // Dark → Final Map (레벨 40 + 세미 보스 처치)
  dark_to_final_map: {
    type: 'level_and_boss', // 새로운 복합 타입
    requiredLevelPerCharacter: 40,
    bossId: 'semi_boss', // 잡아야 할 보스 ID
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
    this.unlockedPortals = new Set();
    this.defeatedBosses = new Set();
    this.listeners = [];
    KillTracker.addListener(this.onKillRecorded.bind(this));
  }

  async getSaveSlotManager() {
    const { default: SaveSlotManager } = await import('../utils/SaveSlotManager.js');
    return SaveSlotManager;
  }

  onKillRecorded(mapKey, enemyType, allKills) {
    this.checkMapPortals(mapKey);
  }

  async checkMapPortals(mapKey) {
    for (const [portalId, condition] of Object.entries(PORTAL_CONDITIONS)) {
      if (condition.sourceMap === mapKey && !this.unlockedPortals.has(portalId)) {
        if (await this.checkCondition(portalId, condition)) {
          this.unlockPortal(portalId);
        }
      }
    }
  }

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
      // ✅ [추가] 복합 조건 (레벨 + 보스)
      case 'level_and_boss':
        return await this.checkLevelAndBossCondition(condition);
      case 'custom':
        return this.checkCustomCondition(portalId, condition);
      default:
        return false;
    }
  }

  checkKillCondition(condition) {
    const { sourceMap, requiredKills } = condition;
    const mapConfig = MAPS[sourceMap];
    if (!mapConfig?.enemies?.types) return false;
    const enemyTypes = mapConfig.enemies.types;
    const mapKills = KillTracker.getMapKills(sourceMap);

    for (const enemyType of enemyTypes) {
      const normalizedKey = enemyType.toLowerCase();
      const kills = mapKills[normalizedKey] || 0;
      if (kills < requiredKills) return false;
    }
    return true;
  }

  checkBossCountCondition(condition) {
    return this.defeatedBosses.size >= condition.requiredBossCount;
  }

  checkBossCondition(condition) {
    if (!condition.bossId) return false;
    return this.defeatedBosses.has(condition.bossId);
  }

  async checkTotalLevelCondition(condition) {
    try {
      const SaveSlotManager = await this.getSaveSlotManager();
      const levelSystem = await SaveSlotManager.getLevelSystem();
      const currentLevel = levelSystem?.level || 1;
      return currentLevel >= condition.requiredLevel;
    } catch (error) {
      return false;
    }
  }

  async checkCharacterLevelsCondition(condition) {
    try {
      const SaveSlotManager = await this.getSaveSlotManager();
      const saveData = await SaveSlotManager.load();
      if (!saveData?.characterExp) return false;

      const { requiredLevelPerCharacter } = condition;
      const characterExp = saveData.characterExp;
      const characterTypes = Object.keys(characterExp);

      if (characterTypes.length === 0) return false;

      for (const charType of characterTypes) {
        const exp = characterExp[charType] || 0;
        const level = this.calculateLevelFromExp(exp);
        if (level < requiredLevelPerCharacter) return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // ✅ [추가] 레벨 + 보스 복합 조건 체크 로직
  async checkLevelAndBossCondition(condition) {
    const levelConditionMet = await this.checkCharacterLevelsCondition(condition);
    const bossConditionMet = this.checkBossCondition(condition);
    return levelConditionMet && bossConditionMet;
  }

  calculateLevelFromExp(totalExp) {
    let level = 1;
    let accumulated = 0;
    let required = 100;
    while (accumulated + required <= totalExp) {
      accumulated += required;
      level++;
      if (level % 10 === 0) required = Math.floor(required * 1.5);
      else required = Math.floor(required * 1.1);
    }
    return level;
  }

  checkCustomCondition(portalId, condition) {
    return false;
  }

  unlockPortal(portalId) {
    this.unlockedPortals.add(portalId);
    this.notifyListeners('portal_unlocked', portalId);
  }

  async recordBossDefeat(bossId) {
    this.defeatedBosses.add(bossId);
    const { default: SaveSlotManager } = await import('../utils/SaveSlotManager.js');
    const saveData = await SaveSlotManager.load();
    if (saveData) {
      saveData.clearedBosses = [...this.defeatedBosses];
      await SaveSlotManager.save(saveData);
    }
    await this.revalidateAllPortals();
  }

  isPortalUnlocked(portalId) {
    if (portalId.includes('_from_')) return true;
    return this.unlockedPortals.has(portalId);
  }

  async getPortalProgress(portalId) {
    const condition = PORTAL_CONDITIONS[portalId];
    if (!condition) return null;

    // ... (기존 kill_count, boss_count 등은 동일) ...

    if (condition.type === 'kill_count') {
      // ... (기존 코드)
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

    if (condition.type === 'boss_defeat') {
      return {
        type: 'boss_defeat',
        bossId: condition.bossId,
        isComplete: this.defeatedBosses.has(condition.bossId),
      };
    }

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
        return null;
      }
    }

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
        return null;
      }
    }

    // ✅ [추가] 복합 조건 UI 데이터 반환
    if (condition.type === 'level_and_boss') {
      try {
        // 1. 레벨 데이터 확인
        const SaveSlotManager = await this.getSaveSlotManager();
        const saveData = await SaveSlotManager.load();
        const characterExp = saveData?.characterExp || {};
        const requiredLevel = condition.requiredLevelPerCharacter;

        const levelProgress = Object.entries(characterExp).map(([charType, exp]) => {
          const level = this.calculateLevelFromExp(exp);
          return {
            characterType: charType,
            level,
            required: requiredLevel,
            completed: level >= requiredLevel,
          };
        });
        const isLevelsComplete = levelProgress.every((p) => p.completed);

        // 2. 보스 데이터 확인
        const isBossComplete = this.defeatedBosses.has(condition.bossId);

        return {
          type: 'level_and_boss',
          levelProgress: levelProgress,
          bossId: condition.bossId,
          isLevelsComplete: isLevelsComplete,
          isBossComplete: isBossComplete,
          isComplete: isLevelsComplete && isBossComplete,
        };
      } catch (error) {
        console.error('레벨+보스 진행도 조회 실패:', error);
        return null;
      }
    }

    return null;
  }

  addListener(callback) {
    this.listeners.push(callback);
  }
  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }
  notifyListeners(event, data) {
    this.listeners.forEach((cb) => cb(event, data));
  }

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

  async revalidateAllPortals() {
    for (const [portalId, condition] of Object.entries(PORTAL_CONDITIONS)) {
      if (this.unlockedPortals.has(portalId)) continue;
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
