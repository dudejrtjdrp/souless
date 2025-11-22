export const EffectData = {
  // 타격 이펙트
  default_sword: {
    url: 'assets/effects/default_sword.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 8 },
    frameRate: 7,
    repeat: 0,
    scale: 1.2,
    offset: { x: 0, y: 0 },
  },

  assassin_multiple_rectangle: {
    url: 'assets/effects/effect_collection_1.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 19, end: 32 },
    frameRate: 14,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 0 },
  },

  princess_windmill: {
    url: 'assets/effects/effect_collection_1.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 38, end: 54 },
    frameRate: 17,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 10 },
  },

  bladekeeper_arrow_circle: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 0, end: 7 },
    frameRate: 8,
    repeat: 0,
    scale: 1,
    offset: { x: 0, y: 0 },
  },

  ranger_cirle_bomb: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 17, end: 11 },
    // frames: { start: 11, end: 17 },
    frameRate: 8,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 10 },
  },

  mauler_rectangle_shield: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 22, end: 29 },
    frameRate: 10,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 0 },
  },

  mauler_q_skill: {
    url: 'assets/effects/mauler/q_skill.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 9 },
    frameRate: 10,
    repeat: 0,
    scale: 2,
    offset: { x: 50, y: 50 },
    flipX: true, // 기본값: 반전 안함
  },

  bladekeeper_blade_turn_in: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 33, end: 41 },
    frameRate: 8,
    repeat: 0,
    scale: 2.5,
    offset: { x: 95, y: 55 },
  },

  bladekeeper_r_skill: {
    url: 'assets/effects/effect_collection_5.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 56, end: 63 },
    frameRate: 7,
    repeat: 0,
    scale: 2,
    offset: { x: 15, y: 0 },
    color: '#85817d',
  },

  princess_water_four_circles_turn_in: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 44, end: 51 },
    frameRate: 8,
    repeat: 0,
    scale: 1,
    offset: { x: 40, y: 10 },
  },

  princess_r_skill: {
    url: 'assets/effects/princess/r_skill.png',
    frameWidth: 66,
    frameHeight: 74,
    frames: { start: 0, end: 19 },
    frameRate: 14,
    repeat: 0,
    scale: 2.5,
    offset: { x: 115, y: 30 },
  },

  monk_circle_turn_in: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 55, end: 62 },
    frameRate: 15,
    repeat: 0,
    scale: 1,
    offset: { x: 0, y: 0 },
  },

  princess_water_turn_out: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 66, end: 73 },
    frameRate: 8,
    repeat: 0,
    scale: 2.5,
    offset: { x: 0, y: 10 },
  },

  assassin_thick_pattern_turn_in: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 77, end: 86 },
    frameRate: 8,
    repeat: 0,
    scale: 2,
    offset: { x: 100, y: 80 },
  },

  assassin_q_skill: {
    url: 'assets/effects/effect_collection_4.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 303, end: 313 },
    frameRate: 8,
    repeat: 0,
    scale: 2,
    offset: { x: 150, y: 70 },
    color: '#cea167',
  },

  assassin_thin_pattern_turn_in: {
    url: 'assets/effects/effect_collection_2.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 88, end: 98 },
    frameRate: 11,
    repeat: 0,
    scale: 2,
    offset: { x: 10, y: 60 },
  },

  fire_knight_slash: {
    url: 'assets/effects/fire_knight/slash.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 8 },
    frameRate: 10,
    repeat: 0,
    scale: 2.5,
    offset: { x: 52, y: 60 },
    angle: 35, // 각도 추가 (degrees)
    flipX: true, // 기본값: 반전 안함
  },

  fire_knight_q_skill: {
    url: 'assets/effects/fire_knight/q_skill.png',
    frameWidth: 64,
    frameHeight: 49,
    frames: { start: 0, end: 14 },
    frameRate: 13,
    repeat: 0,
    scale: 2.5,
    offset: { x: 55, y: 40 },
  },

  fire_knight_q_skill_flip: {
    url: 'assets/effects/fire_knight/q_skill.png',
    frameWidth: 64,
    frameHeight: 49,
    frames: { start: 0, end: 14 },
    frameRate: 13,
    repeat: 0,
    scale: 2.5,
    offset: { x: -55, y: 40 },
    flipX: true, // 기본값: 반전 안함
  },

  fire_knight_w_skill: {
    url: 'assets/effects/fire_knight/w_skill.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 7, end: 0 },
    frameRate: 12,
    repeat: 0,
    scale: 1.9,
    offset: { x: 5, y: 70 },
    angle: -45, // 각도 추가 (degrees)
    flipX: true, // 기본값: 반전 안함
  },

  fire_knight_r_skill: {
    url: 'assets/effects/effect_collection_3.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 11, end: 21 },
    frameRate: 9,
    repeat: 0,
    scale: 3,
    offset: { x: 150, y: 120 },
    color: '#e9470c',
  },

  fire_knight_r_skill_ready: {
    url: 'assets/effects/effect_collection_3.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 35, end: 45 },
    frameRate: 12,
    repeat: 0,
    scale: 1.2,
    offset: { x: -40, y: 100 },
    color: '#d10707',
  },

  fire_knight_hit: {
    url: 'assets/effects/fire_knight/hit/hit.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 9 },
    frameRate: 20,
    repeat: 0,
    scale: 0.5,
    offset: { x: 0, y: 0 },
  },

  monk_q_skill: {
    url: 'assets/effects/monk/q_skill.png',
    frameWidth: 48,
    frameHeight: 48,
    frames: { start: 0, end: 11 },
    frameRate: 10,
    repeat: 0,
    scale: 2.5,
    offset: { x: 100, y: 65 },
  },

  monk_w_skill: {
    url: 'assets/effects/effect_collection_3.png',
    frameWidth: 64,
    frameHeight: 64,
    frames: { start: 251, end: 261 },
    frameRate: 15,
    repeat: 0,
    scale: 1,
    offset: { x: 20, y: 80 },
    color: '#f78e51',
  },

  semi_boss_default_attack: {
    url: 'assets/effects/semi_boss/semi_boss_attack.png',
    frameWidth: 48,
    frameHeight: 64,
    frames: { start: 0, end: 15 },
    frameRate: 16,
    repeat: 0,
    scale: 2,
    offset: { x: 150, y: 40 },
    // color: '#f78e51',
  },

  semi_boss_default_skill: {
    url: 'assets/effects/semi_boss/semi_boss_skill.png',
    frameWidth: 40,
    frameHeight: 32,
    frames: { start: 0, end: 12 },
    frameRate: 16,
    repeat: 0,
    scale: 2,
    offset: { x: 150, y: 40 },
  },

  semi_boss_default_skill_effect: {
    url: 'assets/effects/semi_boss/semi_boss_skill_effect.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: { start: 0, end: 5 },
    frameRate: 6,
    repeat: 0,
    scale: 2,
    offset: { x: 0, y: 0 },
  },
};
