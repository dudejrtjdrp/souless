import SaveSlotManager from '../../utils/SaveSlotManager.js';

export default class JobUnlockManager {
  static JOB_BOSS_MAPPING = {
    assassin: 'assassin_boss',
    monk: 'monk_boss',
    bladekeeper: 'bladekeeper_boss',
    fire_knight: 'fire_knight_boss',
    mauler: 'mauler_boss',
    princess: 'princess_boss',
  };

  static INITIAL_CHARACTERS = ['soul'];

  /**
   * availableBoss에서 선택 가능한 보스 목록 반환
   * (조건 달성했지만 아직 처치 안 한 보스들)
   */
  static async getAvailableBosses() {
    const saveData = await SaveSlotManager.load();

    if (!saveData || !saveData.availableBoss || saveData.availableBoss.length === 0) {
      return [];
    }

    return saveData.availableBoss;
  }

  /**
   * 선택 가능한 캐릭터 목록 반환
   */
  static async getAvailableCharacters() {
    const saveData = await SaveSlotManager.load();

    let availableTypes = [...this.INITIAL_CHARACTERS];

    if (saveData && saveData.availableTypes) {
      availableTypes = [...new Set([...availableTypes, ...saveData.availableTypes])];
    }

    return availableTypes;
  }

  /**
   * 보스 처치 시 캐릭터 해금
   * availableBoss에서 제거 + clearedBosses에 추가 + availableTypes에 추가
   */
  static async unlockCharacter(jobKey) {
    const saveData = await SaveSlotManager.load();

    // 이미 처치한 보스면 중복 방지
    if (saveData.clearedBosses && saveData.clearedBosses.includes(jobKey)) {
      return false;
    }

    if (!saveData.availableTypes) {
      saveData.availableTypes = [...this.INITIAL_CHARACTERS];
    }

    if (!saveData.availableTypes.includes(jobKey)) {
      saveData.availableTypes.push(jobKey);
    }

    if (saveData.availableBoss) {
      saveData.availableBoss = saveData.availableBoss.filter((key) => key !== jobKey);
    }

    if (!saveData.clearedBosses) {
      saveData.clearedBosses = [];
    }

    if (!saveData.clearedBosses.includes(jobKey)) {
      saveData.clearedBosses.push(jobKey);
    }

    await SaveSlotManager.save(saveData);
    return true;
  }

  /**
   * 조건 달성 시 availableBoss에 추가
   * clearedBosses에 있으면 추가하지 않음
   */
  static async addAvailableBoss(jobKey) {
    const saveData = await SaveSlotManager.load();

    // 이미 처치한 보스면 추가 안 함
    if (saveData.clearedBosses && saveData.clearedBosses.includes(jobKey)) {
      return false;
    }

    if (!saveData.availableBoss) {
      saveData.availableBoss = [];
    }

    // 중복 체크 후 추가
    if (!saveData.availableBoss.includes(jobKey)) {
      saveData.availableBoss.push(jobKey);
      await SaveSlotManager.save(saveData);
      return true;
    }

    return false;
  }

  /**
   * 보스 타입 → 직업 키
   */
  static getJobKeyFromBoss(bossType) {
    return Object.keys(this.JOB_BOSS_MAPPING).find(
      (key) => this.JOB_BOSS_MAPPING[key] === bossType,
    );
  }

  /**
   * 직업 키 → 보스 타입
   */
  static getBossTypeFromJob(jobKey) {
    return this.JOB_BOSS_MAPPING[jobKey] || null;
  }

  /**
   * 특정 캐릭터가 해금되었는지 확인
   */
  static async isCharacterUnlocked(jobKey) {
    const available = await this.getAvailableCharacters();
    return available.includes(jobKey);
  }

  /**
   * 특정 보스가 도전 가능한지 확인
   */
  static async isBossAvailable(jobKey) {
    const bosses = await this.getAvailableBosses();
    return bosses.includes(jobKey);
  }

  /**
   * 보스 처치 후 availableBoss에서 제거
   * ⚠️ 이 메서드는 사용하지 않음 - unlockCharacter()에서 처리
   */
  static async removeBossFromAvailable(jobKey) {
    // unlockCharacter()에서 통합 처리되므로 별도로 호출하지 않음
    console.warn('⚠️ removeBossFromAvailable()는 deprecated - unlockCharacter() 사용');
  }

  // 전직 가능 여부 체크
  static async canJobChange(jobKey) {
    // null 또는 유효하지 않은 jobKey 체크
    if (!jobKey) {
      return false;
    }

    const isBossAvailable = await this.isBossAvailable(jobKey);
    const isAlreadyUnlocked = await this.isCharacterUnlocked(jobKey);

    // 보스가 없거나 이미 획득한 캐릭터면 false
    if (!isBossAvailable || isAlreadyUnlocked) {
      return false;
    }

    return true;
  }

  //  모든 사용 가능한 보스 중에서 아직 획득하지 않은 보스만 필터링
  static async getAvailableUnlockedBosses() {
    const allBosses = await this.getAvailableBosses();
    const unlockedCharacters = await this.getAvailableCharacters();

    // 이미 획득하지 않은 보스만 반환
    return allBosses.filter((boss) => !unlockedCharacters.includes(boss));
  }

  //  전체 보스 도전 현황 확인
  static async getBossProgressStats() {
    const allBosses = await this.getAvailableBosses();
    const unlockedCharacters = await this.getAvailableCharacters();
    const completedBosses = allBosses.filter((boss) => unlockedCharacters.includes(boss));

    return {
      totalBosses: allBosses.length,
      completedBosses: completedBosses.length,
      remainingBosses: allBosses.length - completedBosses.length,
      nextBoss: allBosses.find((boss) => !unlockedCharacters.includes(boss)) || null,
      allBossesDefeated: completedBosses.length === allBosses.length,
    };
  }

  /**
   * 다음 전직 가능한 보스 선택 (availableBoss의 첫 번째)
   */
  static async getNextJobBoss() {
    const availableBosses = await this.getAvailableBosses();
    const unlockedCharacters = await this.getAvailableCharacters();

    // 이미 획득한 캐릭터의 보스를 제외
    const nextBosses = availableBosses.filter((boss) => !unlockedCharacters.includes(boss));

    if (nextBosses.length === 0) {
      console.warn('⚠️ 모든 보스를 이미 도전했습니다!');
      return null;
    }

    // 첫 번째 사용 가능한 보스 반환
    return nextBosses[0];
  }

  /**
   * 전체 진행 상황 반환 (UI 표시용)
   */
  static async getProgressSummary() {
    const availableBosses = await this.getAvailableBosses();
    const availableCharacters = await this.getAvailableCharacters();

    const saveData = await SaveSlotManager.load();
    const clearedBosses = saveData.clearedBosses || [];

    const allJobs = Object.keys(this.JOB_BOSS_MAPPING);
    const summary = {};

    for (const job of allJobs) {
      summary[job] = {
        conditionMet: availableBosses.includes(job) || clearedBosses.includes(job),
        bossCleared: clearedBosses.includes(job),
        unlocked: availableCharacters.includes(job),
        bossType: this.JOB_BOSS_MAPPING[job],
      };
    }

    return summary;
  }

  /**
   * 세이브 데이터 초기화 (디버그용)
   */
  static async resetProgress() {
    const saveData = await SaveSlotManager.load();

    saveData.availableBoss = [];
    saveData.availableTypes = [...this.INITIAL_CHARACTERS];
    saveData.clearedBosses = [];

    await SaveSlotManager.save(saveData);
  }
}
