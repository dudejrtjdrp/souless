export default class HitboxConfig {
  /**
   * 충돌 박스 설정 생성
   * @param {number} width - 너비
   * @param {number} height - 높이
   * @param {number} offsetX - X 오프셋
   * @param {number} offsetY - Y 오프셋
   */
  static createCollisionBox(width, height, offsetX, offsetY) {
    return {
      size: { width, height },
      offset: { x: offsetX, y: offsetY },
    };
  }

  /**
   * 공격 히트박스 설정 생성
   * @param {number} width - 너비
   * @param {number} height - 높이
   * @param {number} offsetX - X 오프셋 (캐릭터 기준)
   * @param {number} offsetY - Y 오프셋 (캐릭터 기준)
   * @param {number} duration - 지속 시간 (ms)
   */
  static createAttackHitbox(width, height, offsetX, offsetY, duration = 300) {
    return {
      size: { width, height },
      offset: { x: offsetX, y: offsetY },
      duration,
    };
  }

  /**
   * 스킬 히트박스 설정 생성
   * @param {string} skillName - 스킬 이름
   * @param {Object} config - 히트박스 설정
   */
  static createSkillHitbox(skillName, config) {
    return {
      name: skillName,
      size: config.size || { width: 40, height: 30 },
      offset: config.offset || { x: 30, y: 0 },
      duration: config.duration || 300,
      damage: config.damage || 10,
      knockback: config.knockback || { x: 100, y: -50 },
      effects: config.effects || [], // ['stun', 'burn', etc.]
    };
  }

  /**
   * Soul 기준 충돌 박스 (기본값)
   */
  static get SOUL_COLLISION() {
    return this.createCollisionBox(24, 30, 4, 2);
  }

  /**
   * Soul 기준 공격 히트박스 (기본값)
   */
  static get SOUL_ATTACK() {
    return this.createAttackHitbox(40, 30, 30, 0, 500);
  }
}
