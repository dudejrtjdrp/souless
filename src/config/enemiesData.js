export const EnemiesData = {
  slime: {
    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.0,
      flipX: false,
    },
    physics: {
      width: 32,
      height: 32,
      collideWorldBounds: true,
    },
    stats: {
      maxHP: 30,
      speed: { min: 10, max: 25 },
      patrolRange: { min: 100, max: 300 },
      expReward: 5,
      damageCooldown: 300,
    },
    assets: {
      idle: '/assets/enemy/slime/Slime_Spiked_Idle.png',
      hit: '/assets/enemy/slime/Slime_Spiked_Hit.png',
      death: '/assets/enemy/slime/Slime_Spiked_Death.png',
    },
    animations: [
      { key: 'idle', start: 0, end: 3, frameRate: 6, repeat: -1 },
      { key: 'hit', start: 0, end: 3, frameRate: 8, repeat: 0 },
      { key: 'death', start: 0, end: 5, frameRate: 8, repeat: 0 },
    ],
  },

  canine: {
    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.2,
      flipX: false,
    },
    physics: {
      width: 40,
      height: 40,
      collideWorldBounds: true,
    },
    stats: {
      maxHP: 50,
      speed: { min: 40, max: 60 },
      patrolRange: { min: 150, max: 400 },
      expReward: 8,
      damageCooldown: 300,
    },
    assets: {
      idle: '/assets/enemy/canine/Canine_White_Run.png',
      hit: '/assets/enemy/canine/Canine_White_Hit.png',
      death: '/assets/enemy/canine/Canine_White_Death.png',
    },
    animations: [
      { key: 'idle', start: 0, end: 5, frameRate: 8, repeat: -1 },
      { key: 'hit', start: 0, end: 2, frameRate: 10, repeat: 0 },
      { key: 'death', start: 0, end: 7, frameRate: 10, repeat: 0 },
    ],
  },

  bat: {
    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.5,
      flipX: false,
    },
    physics: {
      width: 30,
      height: 25,
      collideWorldBounds: true,
    },
    stats: {
      maxHP: 20,
      speed: { min: 80, max: 120 },
      patrolRange: { min: 200, max: 500 },
      expReward: 12,
      damageCooldown: 250,
    },
    assets: {
      idle: '/assets/enemy/bat/Bat_Spiked_Idle.png',
      hit: '/assets/enemy/bat/Bat_Spiked_Hit.png',
      death: '/assets/enemy/bat/Bat_Spiked_Death.png',
    },
    animations: [
      { key: 'idle', start: 0, end: 4, frameRate: 10, repeat: -1 },
      { key: 'hit', start: 0, end: 2, frameRate: 12, repeat: 0 },
      { key: 'death', start: 0, end: 5, frameRate: 12, repeat: 0 },
    ],
  },

  purple_monkey: {
    sprite: {
      frameWidth: 32,
      frameHeight: 32,
      scale: 1.5,
      flipX: true,
    },
    physics: {
      width: 30,
      height: 30,
      collideWorldBounds: true,
    },
    stats: {
      maxHP: 80,
      speed: { min: 30, max: 50 },
      patrolRange: { min: 120, max: 250 },
      expReward: 20,
      damageCooldown: 350,
    },
    assets: {
      idle: '/assets/enemy/purple_monkey/Purple_Monkey_Idle.png',
      hit: '/assets/enemy/purple_monkey/Purple_Monkey_Hit.png',
      death: '/assets/enemy/purple_monkey/Purple_Monkey_Death.png',
    },
    animations: [
      { key: 'idle', start: 0, end: 6, frameRate: 8, repeat: -1 },
      { key: 'hit', start: 0, end: 3, frameRate: 10, repeat: 0 },
      { key: 'death', start: 0, end: 8, frameRate: 10, repeat: 0 },
    ],
  },
};
