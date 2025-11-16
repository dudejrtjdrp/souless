// 모든 캐릭터를 Soul 기준 크기로 통일

export default class CharacterNormalizer {
  //  Soul 기준 스펙 (모든 캐릭터가 이 크기로 통일됨)
  static STANDARD_SPEC = {
    // 충돌 박스 (게임 내 절대 픽셀 크기)
    bodySize: { width: 24, height: 30 },
    bodyOffset: { x: 4, y: 2 },

    // 공격 히트박스
    attackHitbox: { width: 40, height: 30 },
    attackOffset: { x: 30, y: 0 },
  };

  /**
   * 충돌 박스와 공격 판정을 Soul 기준으로 통일
   *
   * @param {number} spriteScale - 스프라이트 최종 스케일
   * @param {Object} customBodyOffset - 커스텀 오프셋 (옵션)
   * @returns {Object} 정규화된 설정값
   */
  static getStandardizedConfig(spriteScale, customBodyOffset = null) {
    const standard = this.STANDARD_SPEC;

    // ⭐ 오프셋: 커스텀 값이 있으면 사용, 없으면 기본값
    const bodyOffset = customBodyOffset || standard.bodyOffset;

    // ⭐ 핵심: 충돌 박스는 스케일 역보정으로 항상 절대 크기 유지
    return {
      // Soul과 동일한 충돌 박스 (절대값)
      bodySize: {
        width: standard.bodySize.width / spriteScale,
        height: standard.bodySize.height / spriteScale,
      },
      bodyOffset: {
        x: bodyOffset.x / spriteScale,
        y: bodyOffset.y / spriteScale,
      },

      // Soul과 동일한 공격 판정
      attackHitbox: { ...standard.attackHitbox },
      attackOffset: { ...standard.attackOffset },

      // 최종 충돌 박스 크기 (검증용)
      finalBodySize: {
        width: standard.bodySize.width,
        height: standard.bodySize.height,
      },
      finalBodyOffset: {
        x: bodyOffset.x,
        y: bodyOffset.y,
      },
    };
  }

  /**
   * 디버그용: 충돌 박스 정보 출력
   */
  static debugInfo(spriteKey, spriteScale, config) {
    console.group(` [${spriteKey}] 정규화 정보`);
    console.groupEnd();
  }

  /**
   * Soul과 동일한 충돌 박스인지 검증
   */
  static validateCollisionBox(actualWidth, actualHeight) {
    const standard = this.STANDARD_SPEC.bodySize;
    const widthMatch = Math.abs(actualWidth - standard.width) < 1;
    const heightMatch = Math.abs(actualHeight - standard.height) < 1;

    if (!widthMatch || !heightMatch) {
      console.warn('⚠️ 충돌 박스가 Soul과 다릅니다!', {
        expected: standard,
        actual: { width: actualWidth, height: actualHeight },
      });
      return false;
    }

    return true;
  }
}
