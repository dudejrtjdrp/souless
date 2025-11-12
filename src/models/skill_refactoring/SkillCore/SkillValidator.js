export default class SkillValidator {
  static canUseInAir(skillName) {
    return AIR_ALLOWED_SKILLS.includes(skillName);
  }

  static isCharacterInAir(character) {
    return character.sprite.body && !character.sprite.body.touching.down;
  }

  static canUseSkill(character, skill, skillName) {
    if (this.isCharacterInAir(character) && !this.canUseInAir(skillName)) {
      return false;
    }

    return skill.canUse(character);
  }
}
