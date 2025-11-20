// systems/LevelSystem.js

import SaveSlotManager from '../../../utils/SaveSlotManager.js';

export default class LevelSystem {
  constructor(scene) {
    this.scene = scene;
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = 100;
    this.totalExperience = 0;
  }

  /**
   * 경험치 추가
   * @param {number} amount - 획득 경험치
   * @returns {boolean} - 레벨업 발생 여부
   */
  async addExperience(amount) {
    if (amount <= 0) return false;

    this.experience += amount;
    this.totalExperience += amount;

    let leveledUp = false;

    while (this.experience >= this.experienceToNext) {
      await this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * 레벨업 처리
   */
  async levelUp() {
    this.experience -= this.experienceToNext;
    this.level++;

    this.experienceToNext = this.calculateNextLevelExp(this.level);

    this.scene.events.emit('player-level-up', this.level);

    console.log(`🎉 레벨업! ${this.level} (다음 레벨: ${this.experienceToNext} EXP)`);

    await this.save();
  }

  /**
   * 다음 레벨에 필요한 경험치 계산
   */
  calculateNextLevelExp(nextLevel) {
    if (nextLevel <= 1) return 100;

    // 10레벨 단위로 구간 계산
    const completeTiers = Math.floor((nextLevel - 1) / 10); // 완료된 10레벨 구간
    const levelsInCurrentTier = (nextLevel - 1) % 10; // 현재 구간에서의 레벨

    // 각 구간의 시작 경험치
    // 0구간: 100, 1구간: 100*1.1^9*1.5, 2구간: 위*1.1^9*1.5 ...
    let baseExp = 100;

    // 완료된 구간만큼 1.5 곱하기
    for (let tier = 0; tier < completeTiers; tier++) {
      baseExp = Math.floor(baseExp * Math.pow(1.1, 9) * 1.5);
    }

    // 현재 구간 내에서 1.1씩 증가
    baseExp = Math.floor(baseExp * Math.pow(1.1, levelsInCurrentTier));

    return baseExp;
  }

  /**
   * 특정 레벨의 누적 경험치 계산
   */
  calculateTotalExpForLevel(targetLevel) {
    let total = 0;
    let required = 100;

    for (let lvl = 1; lvl < targetLevel; lvl++) {
      total += required;

      if (lvl % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
    }

    return total;
  }

  /**
   * 현재 레벨 진행도 퍼센트
   */
  getProgressPercent() {
    return (this.experience / this.experienceToNext) * 100;
  }

  /**
   * 레벨 정보 반환
   */
  getLevelInfo() {
    return {
      level: this.level,
      currentExp: this.experience,
      requiredExp: this.experienceToNext,
      progressPercent: this.getProgressPercent(),
      totalExp: this.calculateTotalExpForLevel(this.level) + this.experience,
    };
  }

  /**
   * 레벨 데이터 설정 (로드용)
   */
  setLevelData(level, experience) {
    this.level = level;
    this.experience = experience;
    this.experienceToNext = this.recalculateExpForLevel(level);
  }

  /**
   * 특정 레벨의 필요 경험치 재계산
   */
  recalculateExpForLevel(level) {
    let required = 100;

    for (let lvl = 1; lvl < level; lvl++) {
      if (lvl % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
    }

    return required;
  }

  /**
   * SaveSlotManager에 저장
   */
  async save() {
    try {
      await SaveSlotManager.saveLevelSystem(this.serialize());
    } catch (error) {
      console.error('레벨 시스템 저장 실패:', error);
    }
  }

  /**
   * SaveSlotManager에서 로드
   */
  async load() {
    try {
      const levelData = await SaveSlotManager.getLevelSystem();
      if (levelData) {
        this.deserialize(levelData);
        console.log(`레벨 데이터 로드: Lv.${this.level}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('레벨 시스템 로드 실패:', error);
      return false;
    }
  }

  /**
   * 직렬화
   */
  serialize() {
    return {
      level: this.level,
      experience: this.experience,
      experienceToNext: this.experienceToNext,
      totalExperience: this.totalExperience,
    };
  }

  /**
   * 역직렬화
   */
  deserialize(data) {
    if (data) {
      this.level = data.level || 1;
      this.experience = data.experience || 0;
      this.experienceToNext = data.experienceToNext || 100;
      this.totalExperience = data.totalExperience || 0;
    }
  }

  /**
   * 디버그용: 레벨별 필요 경험치 테이블 출력
   */
  printExpTable(maxLevel = 30) {
    console.log('=== 레벨별 필요 경험치 테이블 ===');
    let required = 100;
    let cumulative = 0;

    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      cumulative += required;
      console.log(`Lv.${lvl}: ${required} EXP (누적: ${cumulative})`);

      if (lvl % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
    }
  }

  destroy() {
    // 정리할 것이 있으면 여기서 처리
  }
}
