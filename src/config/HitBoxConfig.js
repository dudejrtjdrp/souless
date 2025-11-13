export default class HitboxConfig {
  /**
   * 충돌 박스 생성
   * @param {number} width - 너비 (절대 픽셀)
   * @param {number} height - 높이 (절대 픽셀)
   * @param {number} offsetX - X 오프셋 (절대 픽셀)
   * @param {number} offsetY - Y 오프셋 (절대 픽셀)
   */
  static createCollisionBox(width, height, offsetX, offsetY) {
    return {
      size: { width, height },
      offset: { x: offsetX, y: offsetY },
    };
  }

  /**
   * 공격 히트박스 생성
   * @param {number} width - 너비 (절대 픽셀)
   * @param {number} height - 높이 (절대 픽셀)
   * @param {number} offsetX - X 오프셋 (절대 픽셀)
   * @param {number} offsetY - Y 오프셋 (절대 픽셀)
   * @param {number} duration - 지속 시간 (ms) - attack은 여전히 duration 사용
   */
  static createAttackHitbox(width, height, offsetX, offsetY, duration) {
    return {
      size: { width, height },
      offset: { x: offsetX, y: offsetY },
      duration, // 기본 공격은 duration 유지
    };
  }

  /**
   * 스킬 히트박스 생성
   * @param {string} skillName - 스킬 이름
   * @param {Object} options - 스킬 옵션
   */
  static createSkillHitbox(skillName, options) {
    return {
      name: skillName,
      size: options.size || { width: 40, height: 30 },
      offset: options.offset || { x: 30, y: 0 },
      duration: options.duration || 400, // 빌더에서 계산된 값 사용
      damage: options.damage || 10,
      knockback: options.knockback || { x: 0, y: 0 },
      effects: options.effects || [],
      invincible: options.invincible || false,
    };
  }
}
