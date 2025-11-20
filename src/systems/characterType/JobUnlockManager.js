import SaveSlotManager from '../../utils/SaveSlotManager.js';

export default class JobUnlockManager {
  // 전직 조건과 보스 매칭 정보
  static JOB_BOSS_MAPPING = {
    assassin: 'assassin_boss',
    monk: 'monk_boss',
    bladekeeper: 'bladekeeper_boss',
    fire_knight: 'fire_knight_boss',
    mauler: 'mauler_boss',
    princess: 'princess_boss',
  };

  // 초기 해금 캐릭터
  static INITIAL_CHARACTERS = ['soul'];

  /**
   * availableBoss에서 선택 가능한 보스 목록 반환
   * 조건에 도달한 순서대로 정렬됨
   */
  static async getAvailableBosses() {
    const saveData = await SaveSlotManager.load();

    if (!saveData || !saveData.availableBoss || saveData.availableBoss.length === 0) {
      // 기본 보스 (Assassin)
      return ['assassin'];
    }

    return saveData.availableBoss;
  }

  /**
   * availableTypes에서 선택 가능한 캐릭터 목록 반환
   */
  static async getAvailableCharacters() {
    const saveData = await SaveSlotManager.load();

    let availableTypes = [...this.INITIAL_CHARACTERS]; // soul은 항상 가능

    if (saveData && saveData.availableTypes) {
      availableTypes = [...new Set([...availableTypes, ...saveData.availableTypes])];
    }

    return availableTypes;
  }

  /**
   * 보스 처치 시 캐릭터 해금
   */
  static async unlockCharacter(jobKey) {
    const saveData = await SaveSlotManager.load();

    if (!saveData.availableTypes) {
      saveData.availableTypes = [...this.INITIAL_CHARACTERS];
    }

    // 중복 체크 후 추가
    if (!saveData.availableTypes.includes(jobKey)) {
      saveData.availableTypes.push(jobKey);
      await SaveSlotManager.save(saveData);

      console.log(`🎉 ${jobKey} 캐릭터 해금!`);
      return true;
    }

    return false;
  }

  /**
   * 조건 달성 시 availableBoss에 추가
   * (JobConditionTracker에서 호출)
   */
  static async addAvailableBoss(jobKey) {
    const saveData = await SaveSlotManager.load();

    if (!saveData.availableBoss) {
      saveData.availableBoss = [];
    }

    // 중복 체크 후 추가 (순서 유지)
    if (!saveData.availableBoss.includes(jobKey)) {
      saveData.availableBoss.push(jobKey);
      await SaveSlotManager.save(saveData);

      console.log(`📋 ${jobKey} 보스 도전 가능!`);
      return true;
    }

    return false;
  }

  /**
   * 보스 타입에 해당하는 직업 키 반환
   */
  static getJobKeyFromBoss(bossType) {
    return Object.keys(this.JOB_BOSS_MAPPING).find(
      (key) => this.JOB_BOSS_MAPPING[key] === bossType,
    );
  }

  /**
   * 직업 키에 해당하는 보스 타입 반환
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
   * availableBoss에서 보스 제거 (보스 처치 후)
   */
  static async removeBossFromAvailable(jobKey) {
    const saveData = await SaveSlotManager.load();

    if (saveData.availableBoss) {
      saveData.availableBoss = saveData.availableBoss.filter((key) => key !== jobKey);
      await SaveSlotManager.save(saveData);
    }
  }

  /**
   * 전직 가능 여부 체크
   * availableBoss에 해당 직업이 있고, 보스를 처치하지 않았는지 확인
   */
  static async canJobChange(jobKey) {
    const isBossAvailable = await this.isBossAvailable(jobKey);
    const isAlreadyUnlocked = await this.isCharacterUnlocked(jobKey);

    // 보스는 도전 가능하지만 아직 해금되지 않은 경우에만 전직 가능
    return isBossAvailable && !isAlreadyUnlocked;
  }

  /**
   * 다음 전직 가능한 보스 선택
   * availableBoss의 첫 번째 항목 반환
   */
  static async getNextJobBoss() {
    const bosses = await this.getAvailableBosses();
    return bosses.length > 0 ? bosses[0] : 'assassin'; // 기본값 assassin
  }

  /**
   * 전체 진행 상황 반환 (UI 표시용)
   */
  static async getProgressSummary() {
    const availableBosses = await this.getAvailableBosses();
    const availableCharacters = await this.getAvailableCharacters();

    const allJobs = Object.keys(this.JOB_BOSS_MAPPING);

    const summary = {};

    for (const job of allJobs) {
      summary[job] = {
        conditionMet: availableBosses.includes(job),
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

    await SaveSlotManager.save(saveData);

    console.log('🔄 전직 진행 상황 초기화됨');
  }
}
