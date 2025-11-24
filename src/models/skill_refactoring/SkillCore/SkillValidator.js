// systems/Skills/SkillCore/SkillValidator.js

const AIR_ALLOWED_SKILLS = ['air_attack', 's_skill', 'attack'];

export default class SkillValidator {
  /**
   * ✨ 스킬 키 매핑
   */
  static skillKeyMapping = {
    q_skill: 'Q',
    dash: 'Q',
    w_skill: 'W',
    e_skill: 'E',
    r_skill: 'R',
    s_skill: 'S',
    attack: 'A',
    air_attack: 'A',
  };

  /**
   * 공중에서 사용 가능한 스킬인지 체크
   */
  static canUseInAir(skillName) {
    return AIR_ALLOWED_SKILLS.includes(skillName);
  }

  /**
   * 캐릭터가 공중에 있는지 체크
   */
  static isCharacterInAir(character) {
    return character.sprite.body && !character.sprite.body.touching.down;
  }

  /**
   * 힐링 스킬이 사용 불가능한 상태인지 체크
   */
  static isHealingSkillUnusable(character, config) {
    const hasHealAmount = config?.healAmount > 0;
    const hasManaAmount = config?.manaAmount > 0;

    const isHpFull = character.health >= character.maxHealth;
    const isManaFull = character.mana >= character.maxMana;

    // healAmount만 있고 체력이 꽉 찬 경우
    if (hasHealAmount && !hasManaAmount && isHpFull) {
      return true;
    }

    // manaAmount만 있고 마나가 꽉 찬 경우
    if (hasManaAmount && !hasHealAmount && isManaFull) {
      return true;
    }

    // 둘 다 있고 체력과 마나가 모두 꽉 찬 경우
    if (hasHealAmount && hasManaAmount && isHpFull && isManaFull) {
      return true;
    }

    return false;
  }

  /**
   * ✨ 스킬 잠금 체크
   */
  static isSkillLocked(character, skillName) {
    const scene = character.scene;
    const skillUnlockSystem = scene?.skillUnlockSystem;

    if (!skillUnlockSystem) return false;

    const skillKey = this.skillKeyMapping[skillName];
    if (!skillKey) return false;

    return !skillUnlockSystem.isSkillUnlocked(skillKey);
  }

  /**
   * 스킬 사용 가능 여부 종합 체크
   */
  static canUseSkill(character, skill, skillName) {
    // 1. ✨ 스킬 잠금 체크 (최우선)
    if (this.isSkillLocked(character, skillName)) {
      return false;
    }

    // 2. 공중 체크
    if (this.isCharacterInAir(character) && !this.canUseInAir(skillName)) {
      return false;
    }

    // 3. 힐링 스킬 체크
    if (this.isHealingSkillUnusable(character, skill.config)) {
      return false;
    }

    // 4. 무적 상태 & 스킬 사용 중 체크
    if (character.isInvincible && character.isUsingSkill && character.isUsingSkill()) {
      return false;
    }

    // 5. 사망 중이면 스킬 사용 불가
    if (character.isDying) {
      return false;
    }

    // 6. Skill 객체의 기본 체크 (쿨타임, 리소스 등)
    return skill.canUse(character);
  }

  /**
   * 스킬 활성화 시 호출
   */
  static onSkillActivate(character, skillName) {
    // 보스 처치로 인한 무적이 아닌 경우만 무적 해제
    // (isUsingSkill()이 true인 경우만 정상적인 스킬 사용)

    // 피해 후 무적 중이면 그대로 유지
    // 보스 처치로 인한 무적이면 해제하지 않음
    if (character.isInvincible && !character.isDying) {
      return;
    }
  }

  /**
   * ✨ 스킬 잠금 정보 반환
   */
  static getSkillLockInfo(character, skillName) {
    const scene = character.scene;
    const skillUnlockSystem = scene?.skillUnlockSystem;
    const skillKey = this.skillKeyMapping[skillName];

    if (!skillKey || !skillUnlockSystem) {
      return { locked: false, requiredLevel: 1 };
    }

    return {
      locked: !skillUnlockSystem.isSkillUnlocked(skillKey),
      requiredLevel: skillUnlockSystem.getRequiredLevel(skillKey),
      currentLevel: scene.levelSystem?.level || 1,
    };
  }
}
