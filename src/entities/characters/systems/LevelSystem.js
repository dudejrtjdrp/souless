import SaveSlotManager from '../../../utils/SaveSlotManager.js';

export default class LevelSystem {
  constructor(scene) {
    this.scene = scene;

    // 전체 레벨 (기존)
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = 100;
    this.totalExperience = 0;

    // ✅ 캐릭터별 레벨 - Map으로 변경!
    this.characterLevels = new Map();

    // 레벨 커브 정의
    this.LEVEL_CURVE = this.buildLevelCurve();
  }

  // 레벨 커브 생성
  buildLevelCurve() {
    const curve = { 1: 100 };
    let required = 100;

    for (let lvl = 2; lvl <= 100; lvl++) {
      if ((lvl - 1) % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
      curve[lvl] = required;
    }

    return curve;
  }

  // 캐릭터 레벨 초기화 메서드
  initializeCharacterLevel(characterType) {
    if (!this.characterLevels.has(characterType)) {
      this.characterLevels.set(characterType, {
        level: 1,
        experience: 0,
        experienceToNext: this.LEVEL_CURVE[1] || 100,
      });
    }
  }

  /**
   * ✨ 특정 캐릭터의 레벨 가져오기
   */
  getCharacterLevel(characterType) {
    if (!this.characterLevels) {
      console.warn('⚠️ characterLevels not initialized!');
      return 1;
    }

    const charData = this.characterLevels.get(characterType);

    if (!charData) {
      console.warn(`⚠️ Character data not found for: ${characterType}`);
      return 1;
    }

    const level = charData.level || 1;

    return level;
  }

  // 특정 캐릭터의 경험치 정보 가져오기
  getCharacterExpInfo(characterType) {
    if (!this.characterLevels.has(characterType)) {
      this.initializeCharacterLevel(characterType);
    }
    return this.characterLevels.get(characterType);
  }

  /**
   * 경험치 추가 (전체 레벨)
   */
  async addExperience(amount) {
    return this.addExperienceSync(amount);
  }

  /**
   * ✨ 특정 캐릭터에게 경험치 추가
   */
  addCharacterExperience(characterType, amount) {
    if (!this.characterLevels.has(characterType)) {
      this.initializeCharacterLevel(characterType);
    }

    const charData = this.characterLevels.get(characterType);
    charData.experience += amount;

    let leveledUp = false;

    while (charData.experience >= charData.experienceToNext) {
      charData.experience -= charData.experienceToNext;
      charData.level++;
      charData.experienceToNext = this.calculateNextLevelExp(charData.level);

      // 캐릭터별 레벨업 이벤트 발생
      this.scene.events.emit('character-level-up', {
        characterType,
        level: charData.level,
      });

      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * 레벨업 처리 (전체)
   */
  async levelUp() {
    this.experience -= this.experienceToNext;
    this.level++;

    this.experienceToNext = this.calculateNextLevelExp(this.level);

    this.scene.events.emit('player-level-up', this.level);

    await this.save();
  }

  /**
   * 다음 레벨에 필요한 경험치 계산
   */
  calculateNextLevelExp(nextLevel) {
    if (nextLevel <= 1) return 100;

    const completeTiers = Math.floor((nextLevel - 1) / 10);
    const levelsInCurrentTier = (nextLevel - 1) % 10;

    let baseExp = 100;

    for (let tier = 0; tier < completeTiers; tier++) {
      baseExp = Math.floor(baseExp * Math.pow(1.1, 9) * 1.5);
    }

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
   * ✨ 특정 캐릭터의 레벨 진행도 퍼센트
   */
  getCharacterProgressPercent(characterType) {
    const charData = this.getCharacterExpInfo(characterType);
    return (charData.experience / charData.experienceToNext) * 100;
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('레벨 시스템 로드 실패:', error);
      return false;
    }
  }

  addExperienceSync(amount) {
    if (amount <= 0) return false;

    this.experience += amount;
    this.totalExperience += amount;

    let leveledUp = false;

    while (this.experience >= this.experienceToNext) {
      this.experience -= this.experienceToNext;
      this.level++;
      this.experienceToNext = this.calculateNextLevelExp(this.level);

      this.scene.events.emit('player-level-up', this.level);
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * 직렬화 - Map을 객체로 변환
   */
  serialize() {
    // Map을 일반 객체로 변환
    const characterLevelsObj = {};
    for (const [key, value] of this.characterLevels.entries()) {
      characterLevelsObj[key] = value;
    }

    return {
      level: this.level,
      experience: this.experience,
      experienceToNext: this.experienceToNext,
      totalExperience: this.totalExperience,
      characterLevels: characterLevelsObj, // ✨ 객체로 저장
    };
  }

  /**
   * 역직렬화 - 객체를 Map으로 변환
   */
  deserialize(data) {
    if (data) {
      this.level = data.level || 1;
      this.experience = data.experience || 0;
      this.experienceToNext = data.experienceToNext || 100;
      this.totalExperience = data.totalExperience || 0;

      // ✅ 객체를 Map으로 변환
      this.characterLevels = new Map();
      if (data.characterLevels) {
        for (const [key, value] of Object.entries(data.characterLevels)) {
          this.characterLevels.set(key, value);
        }
      }
    }
  }

  /**
   * 디버그용: 레벨별 필요 경험치 테이블 출력
   */
  printExpTable(maxLevel = 30) {
    let required = 100;
    let cumulative = 0;

    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      cumulative += required;

      if (lvl % 10 === 0) {
        required = Math.floor(required * 1.5);
      } else {
        required = Math.floor(required * 1.1);
      }
    }
  }

  destroy() {
    this.characterLevels.clear();
  }
}
