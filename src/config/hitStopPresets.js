export const PRESETS = {
  // ============================================
  // 기본 타격 (Basic Hits)
  // ============================================

  // 가벼운 타격 - 거의 안 멈춤, 약한 줌
  LIGHT: {
    duration: 50,
    intensity: 0.4,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.01,
  },

  // 중간 타격 - 명확한 정지감
  MEDIUM: {
    duration: 100,
    intensity: 0.1,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.025,
  },

  // 강한 타격 - 완전 정지 + 강한 줌
  HEAVY: {
    duration: 150,
    intensity: 0,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.045,
  },

  // 크리티컬 - 최대 임팩트, 줌 아웃
  CRITICAL: {
    duration: 200,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: -0.03, // 줌 아웃!
  },

  // ============================================
  // 방향성 타격 (Directional Hits)
  // ============================================

  // 횡베기 - 짧고 강렬
  SLASH: {
    duration: 70,
    intensity: 0.2,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.02,
  },

  // 어퍼컷 - 위로 치솟는 느낌
  UPPERCUT: {
    duration: 120,
    intensity: 0.05,
    smoothRecover: true,
    shakeDirection: 'up',
    zoom: true,
    zoomIntensity: 0.04,
  },

  // 다운 스매시 - 바닥에 내려찍기
  SMASH_DOWN: {
    duration: 140,
    intensity: 0,
    smoothRecover: false, // 급격한 멈춤
    shakeDirection: 'down',
    shake: true,
    zoom: true,
    zoomIntensity: 0.05,
  },

  // ============================================
  // 특수 공격 (Special Attacks)
  // ============================================

  // 관통 - 빠르고 날카로운, 줌 없음
  PIERCE: {
    duration: 60,
    intensity: 0.3,
    smoothRecover: true,
    zoom: false, // 줌 효과 없음
  },

  // 폭발 - 강한 충격, 줌 아웃
  EXPLOSION: {
    duration: 180,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: -0.04, // 줌 아웃
  },

  // 카운터 - 반격, 시간 역전 느낌
  COUNTER: {
    duration: 90,
    intensity: 0.15,
    smoothRecover: false, // 급격히 복구
    zoom: true,
    zoomIntensity: 0.03,
  },

  // 백스탭 - 빠른 암살
  BACKSTAB: {
    duration: 110,
    intensity: 0.1,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.035,
  },

  // ============================================
  // 연속 공격 (Combo Attacks)
  // ============================================

  // 콤보 1-2타 - 가볍게
  COMBO_LIGHT: {
    duration: 40,
    intensity: 0.45,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.008,
  },

  // 콤보 3-4타 - 점점 강하게
  COMBO_MEDIUM: {
    duration: 70,
    intensity: 0.25,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.018,
  },

  // 콤보 피니셔 - 폭발적인 마무리
  COMBO_FINISHER: {
    duration: 160,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: 0.055,
  },

  // ============================================
  // 원소 속성 (Elemental)
  // ============================================

  // 불 속성 - 뜨거운 타격
  FIRE: {
    duration: 100,
    intensity: 0.15,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.028,
  },

  // 얼음 속성 - 급격한 동결
  ICE: {
    duration: 130,
    intensity: 0,
    smoothRecover: false, // 얼음은 급격히 멈춤
    zoom: true,
    zoomIntensity: 0.022,
  },

  // 번개 속성 - 순간적인 충격
  LIGHTNING: {
    duration: 50,
    intensity: 0.35,
    smoothRecover: false, // 빠르게 복구
    zoom: true,
    zoomIntensity: 0.015,
  },

  // 독 속성 - 느리게 퍼지는 독
  POISON: {
    duration: 80,
    intensity: 0.25,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.012,
  },

  // ============================================
  // 무기 타입 (Weapon Types)
  // ============================================

  // 검 - 날카로운 베기
  SWORD: {
    duration: 75,
    intensity: 0.22,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.02,
  },

  // 둔기 - 무거운 타격, 줌 아웃
  FIREKNIGHT: {
    duration: 100,
    intensity: 0.005,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.005, // 줌 아웃
  },

  // 창 - 찌르기, 줌 없음
  SPEAR: {
    duration: 65,
    intensity: 0.28,
    smoothRecover: true,
    zoom: false,
  },

  // 활 - 화살 명중
  ARROW: {
    duration: 55,
    intensity: 0.35,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.012,
  },

  // 총 - 총알 명중, 빠른 정지
  GUN: {
    duration: 45,
    intensity: 0.4,
    smoothRecover: false,
    zoom: true,
    zoomIntensity: 0.01,
  },

  // ============================================
  // 상태 효과 (Status Effects)
  // ============================================

  // 기절 - 오래 멈춤
  STUN: {
    duration: 180,
    intensity: 0,
    smoothRecover: false,
    shake: true,
    zoom: true,
    zoomIntensity: 0.042,
  },

  // 넉백 - 밀쳐내기, 줌 아웃
  KNOCKBACK: {
    duration: 110,
    intensity: 0.12,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: -0.025, // 줌 아웃
  },

  // 다운 - 쓰러트리기
  KNOCKDOWN: {
    duration: 200,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: 0.06,
  },

  // ============================================
  // 보스 전용 (Boss Attacks)
  // ============================================

  // 보스 일반 공격
  BOSS_NORMAL: {
    duration: 120,
    intensity: 0.08,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: 0.038,
  },

  // 보스 강공격 - 줌 아웃
  BOSS_HEAVY: {
    duration: 200,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: -0.045, // 줌 아웃
  },

  // 보스 필살기 - 극대 임팩트
  FIREKNIGHT_ULTIMATE: {
    duration: 300,
    intensity: 0,
    smoothRecover: false,
    shake: true,
    zoom: true,
    zoomIntensity: 0.08,
  },

  // ============================================
  // 기타 (Miscellaneous)
  // ============================================

  // 회피 성공 - 거의 안 멈춤
  DODGE: {
    duration: 35,
    intensity: 0.5,
    smoothRecover: true,
    zoom: false,
  },

  // 패리 성공 - 짧고 강렬
  PARRY: {
    duration: 80,
    intensity: 0.2,
    smoothRecover: false,
    zoom: true,
    zoomIntensity: 0.022,
  },

  // 가드 브레이크 - 강한 충격
  GUARD_BREAK: {
    duration: 150,
    intensity: 0,
    smoothRecover: true,
    shake: true,
    zoom: true,
    zoomIntensity: 0.048,
  },

  // 약점 공격 - 치명적
  WEAK_POINT: {
    duration: 130,
    intensity: 0.05,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.04,
  },

  // 그레이즈 - 스쳐지나감
  GRAZE: {
    duration: 25,
    intensity: 0.6,
    smoothRecover: true,
    zoom: false,
  },

  // 미스/블록 - 가볍게
  BLOCK: {
    duration: 45,
    intensity: 0.45,
    smoothRecover: true,
    zoom: true,
    zoomIntensity: 0.008,
  },
};
