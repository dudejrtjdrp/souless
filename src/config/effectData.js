export const EffectData = {
  // 근접 공격 이펙트
  slash_basic: {
    url: 'assets/effects/slash_basic.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 5 },
    frameRate: 15,
    repeat: 0,
    scale: 1.5,
    offset: { x: 0, y: 0 }, // 히트박스 중심 기준 오프셋
  },

  slash_heavy: {
    url: 'assets/effects/slash_heavy.png',
    frameWidth: 192,
    frameHeight: 192,
    frames: { start: 0, end: 8 },
    frameRate: 20,
    repeat: 0,
    scale: 2.0,
    offset: { x: 0, y: 0 },
  },

  // 타격 이펙트
  impact_light: {
    url: 'assets/effects/impact_light.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 8 },
    frameRate: 7,
    repeat: 0,
    scale: 1.2,
    offset: { x: 0, y: 0 },
  },

  impact_heavy: {
    url: 'assets/effects/impact_heavy.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 6 },
    frameRate: 15,
    repeat: 0,
    scale: 1.8,
    offset: { x: 0, y: 0 },
  },

  // 에너지 이펙트
  energy_wave: {
    url: 'assets/effects/energy_wave.png',
    frameWidth: 256,
    frameHeight: 128,
    frames: { start: 0, end: 10 },
    frameRate: 18,
    repeat: 0,
    scale: 2.0,
    offset: { x: 20, y: 0 },
  },

  // 힐링 이펙트
  heal_aura: {
    url: 'assets/effects/heal_aura.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 7 },
    frameRate: 10,
    repeat: -1, // 무한 반복
    scale: 1.5,
    offset: { x: 0, y: -20 },
    alpha: 0.8,
  },

  // 불꽃 이펙트
  fire_burst: {
    url: 'assets/effects/fire_burst.png',
    frameWidth: 160,
    frameHeight: 160,
    frames: { start: 0, end: 9 },
    frameRate: 20,
    repeat: 0,
    scale: 1.8,
    offset: { x: 0, y: 0 },
  },

  // 스턴 이펙트
  stun_stars: {
    url: 'assets/effects/stun_stars.png',
    frameWidth: 96,
    frameHeight: 96,
    frames: { start: 0, end: 6 },
    frameRate: 12,
    repeat: -1,
    scale: 1.0,
    offset: { x: 0, y: -40 }, // 머리 위에 표시
  },

  // 대시 이펙트
  dash_trail: {
    url: 'assets/effects/dash_trail.png',
    frameWidth: 128,
    frameHeight: 64,
    frames: { start: 0, end: 5 },
    frameRate: 15,
    repeat: 0,
    scale: 1.5,
    offset: { x: -30, y: 0 },
  },

  // 폭발 이펙트
  explosion: {
    url: 'assets/effects/explosion.png',
    frameWidth: 192,
    frameHeight: 192,
    frames: { start: 0, end: 11 },
    frameRate: 24,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 0 },
  },

  // 검기 이펙트
  sword_beam: {
    url: 'assets/effects/sword_beam.png',
    frameWidth: 256,
    frameHeight: 96,
    frames: { start: 0, end: 8 },
    frameRate: 20,
    repeat: 0,
    scale: 2.0,
    offset: { x: 30, y: 0 },
  },

  // 충격파 이펙트
  shockwave: {
    url: 'assets/effects/shockwave.png',
    frameWidth: 256,
    frameHeight: 128,
    frames: { start: 0, end: 7 },
    frameRate: 15,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 10 },
  },
};
