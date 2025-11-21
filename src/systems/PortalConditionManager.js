import { KillTracker } from './KillTracker';
import { MAPS } from '../config/mapData';
import { PORTAL_CONNECTIONS } from '../config/portalData';

// 포탈별 열림 조건 정의
export const PORTAL_CONDITIONS = {
  // ===== 기본 조건: 맵의 모든 몹 종류 각 20마리 =====

  // Other Cave → Scary Cave
  other_cave_to_scary_cave: {
    type: 'kill_count',
    requiredKills: 20, // 각 몹 종류당 필요 킬 수
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

  // Temple 1 → Temple 2
  temple_1_to_temple_2: {
    type: 'boss_defeat',
    bossId: null, // 나중에 설정
    sourceMap: 'temple_1',
  },

  // Temple 2 → Temple 3
  temple_2_to_temple_3: {
    type: 'boss_defeat',
    bossId: null,
    sourceMap: 'temple_2',
  },

  // Temple 3 → Temple 4
  temple_3_to_temple_4: {
    type: 'boss_defeat',
    bossId: null,
    sourceMap: 'temple_3',
  },

  // Temple 4 → Snow
  temple_4_to_snow: {
    type: 'boss_defeat',
    bossId: null,
    sourceMap: 'temple_4',
  },

  // Snow → Dark
  snow_to_dark: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'snow',
  },

  // Dark → Final Map
  dark_to_final_map: {
    type: 'kill_count',
    requiredKills: 20,
    sourceMap: 'dark',
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
   * 킬 기록 시 호출 - 포탈 조건 체크
   */
  onKillRecorded(mapKey, enemyType, allKills) {
    this.checkMapPortals(mapKey);
  }

  /**
   * 특정 맵의 모든 포탈 조건 체크
   */
  checkMapPortals(mapKey) {
    Object.entries(PORTAL_CONDITIONS).forEach(([portalId, condition]) => {
      if (condition.sourceMap === mapKey && !this.unlockedPortals.has(portalId)) {
        if (this.checkCondition(portalId, condition)) {
          this.unlockPortal(portalId);
        }
      }
    });
  }

  /**
   * 개별 조건 체크
   */
  checkCondition(portalId, condition) {
    switch (condition.type) {
      case 'kill_count':
        return this.checkKillCondition(condition);

      case 'boss_defeat':
        return this.checkBossCondition(condition);

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
      // [수정] getPortalProgress와 동일하게 소문자로 정규화하여 체크
      const normalizedKey = enemyType.toLowerCase();
      const kills = mapKills[normalizedKey] || 0;

      if (kills < requiredKills) {
        return false;
      }
    }

    return true;
  }

  /**
   * 보스 처치 조건 체크 (나중에 구현)
   */
  checkBossCondition(condition) {
    if (!condition.bossId) return false;
    return this.defeatedBosses.has(condition.bossId);
  }

  /**
   * 커스텀 조건 체크 (나중에 구현)
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
    console.log(`🌀 Portal unlocked: ${portalId}`);

    // 리스너들에게 알림 (UI 업데이트, 이펙트 등)
    this.notifyListeners('portal_unlocked', portalId);
  }

  /**
   * 보스 처치 기록 (외부에서 호출)
   */
  recordBossDefeat(bossId) {
    this.defeatedBosses.add(bossId);
    console.log(`👑 Boss defeated: ${bossId}`);

    // 보스 처치로 열릴 수 있는 포탈 체크
    Object.entries(PORTAL_CONDITIONS).forEach(([portalId, condition]) => {
      if (condition.type === 'boss_defeat' && condition.bossId === bossId) {
        if (!this.unlockedPortals.has(portalId)) {
          this.unlockPortal(portalId);
        }
      }
    });
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
  getPortalProgress(portalId) {
    const condition = PORTAL_CONDITIONS[portalId];
    if (!condition) return null;

    if (condition.type === 'kill_count') {
      const mapConfig = MAPS[condition.sourceMap];
      if (!mapConfig?.enemies?.types) return null;

      const enemyTypes = mapConfig.enemies.types;
      const mapKills = KillTracker.getMapKills(condition.sourceMap);
      const required = condition.requiredKills;

      const progress = enemyTypes.map((type) => {
        // 핵심 수정: 소문자로 정규화
        const normalizedKey = type.toLowerCase();
        const current = mapKills[normalizedKey] || 0;

        return {
          enemyType: type, // UI 표시용 원본 이름
          displayName: normalizedKey, // 디버깅용
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

    if (condition.type === 'boss_defeat') {
      return {
        type: 'boss_defeat',
        bossId: condition.bossId,
        isComplete: this.defeatedBosses.has(condition.bossId),
      };
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

  revalidateAllPortals() {
    console.log('🔄 모든 포탈 조건 재검사 중...');

    // 모든 포탈 조건에 대해 체크
    Object.entries(PORTAL_CONDITIONS).forEach(([portalId, condition]) => {
      // 이미 열린 포탈은 스킵
      if (this.unlockedPortals.has(portalId)) {
        return;
      }

      // 조건 체크
      if (this.checkCondition(portalId, condition)) {
        this.unlockPortal(portalId);
        console.log(`포탈 자동 해제: ${portalId}`);
      }
    });

    console.log('재검사 완료. 열린 포탈:', [...this.unlockedPortals]);
  }

  reset() {
    this.unlockedPortals.clear();
    this.defeatedBosses.clear();
  }
}

export const PortalConditionManager = new PortalConditionManagerClass();
