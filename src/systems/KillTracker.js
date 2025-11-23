class KillTrackerClass {
  constructor() {
    this.kills = {};
    this.listeners = []; // 포탈 열림 등 이벤트 리스너
  }

  /**
   * 몹 처치 기록
   * @param {string} mapKey - 맵 키 (예: 'cave', 'forest')
   * @param {string} enemyType - 몹 타입 (예: 'Slime', 'Bat')
   */
  recordKill(mapKey, enemyType) {
    if (!this.kills[mapKey]) {
      this.kills[mapKey] = {};
    }
    if (!this.kills[mapKey][enemyType]) {
      this.kills[mapKey][enemyType] = 0;
    }

    this.kills[mapKey][enemyType]++;

    // 리스너들에게 알림 (포탈 조건 체크 등)
    this.notifyListeners(mapKey, enemyType);
  }

  /**
   * 특정 맵의 특정 몹 처치 수 조회
   */
  getKillCount(mapKey, enemyType) {
    return this.kills[mapKey]?.[enemyType] || 0;
  }

  /**
   * 특정 맵의 전체 킬 카운트 조회
   */
  getMapKills(mapKey) {
    return this.kills[mapKey] || {};
  }

  /**
   * 리스너 등록 (포탈 매니저 등에서 사용)
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  notifyListeners(mapKey, enemyType, allKills) {
    this.listeners.forEach((callback) => {
      try {
        callback(mapKey, enemyType, allKills);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  /**
   * 데이터 초기화 (새 게임 시작 시)
   */
  reset() {
    this.kills = {};
  }

  /**
   * 저장/불러오기용 데이터
   */
  serialize() {
    return JSON.stringify(this.kills);
  }

  deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      this.kills = parsed || {};
      this.notifyListeners('all', 'all', this.kills);
    } catch (e) {
      console.error('Failed to load kill data:', e);
      this.kills = {};
    }
  }
}

export const KillTracker = new KillTrackerClass();
