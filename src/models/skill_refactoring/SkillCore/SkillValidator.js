const AIR_ALLOWED_SKILLS = ['air_attack', 's_skill', 'attack'];

export default class SkillValidator {
  static canUseInAir(skillName) {
    console.log(skillName);
    return AIR_ALLOWED_SKILLS.includes(skillName);
  }

  static isCharacterInAir(character) {
    console.log(3);
    return character.sprite.body && !character.sprite.body.touching.down;
  }

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

  static canUseSkill(character, skill, skillName) {
    // 공중 체크
    if (this.isCharacterInAir(character) && !this.canUseInAir(skillName)) {
      console.log(4);
      return false;
    }

    // 힐링 스킬 체크
    if (this.isHealingSkillUnusable(character, skill.config)) {
      console.log(5);
      return false;
    }

    return skill.canUse(character);
  }
}
