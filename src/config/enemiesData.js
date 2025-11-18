export const EnemiesData = {
  slime: {
    type: 'normal',

    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.5,
      flipX: false,
    },

    physics: {
      width: 20,
      height: 20,
      collideWorldBounds: true,
      offsetX: 22, // 직접 조정
      offsetY: 30, // 직접 조정
    },

    stats: {
      maxHP: 20,
      speed: { min: 40, max: 40 },
      patrolRange: { min: 150, max: 150 },
      expReward: 10,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/enemy/slime/Slime_Spiked_Idle.png',
      hit: '/assets/enemy/slime/Slime_Spiked_Hit.png',
      death: '/assets/enemy/slime/Slime_Spiked_Death.png',
      attack: '/assets/enemy/slime/Slime_Spiked_Hit.png',
    },

    animations: {
      idle: { start: 0, end: 3, frameRate: 6, repeat: -1 },
      hit: { start: 0, end: 2, frameRate: 10, repeat: 0 },
      death: { start: 0, end: 4, frameRate: 8, repeat: 0 },
      attack: { start: 0, end: 3, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'patrol',
      detectRange: 180,
      attack: {
        range: 60,
        damage: 1,
        cooldown: 1800,
        hitDelay: 200,
      },
    },
  },

  canine: {
    type: 'normal',

    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.2,
      flipX: false,
    },

    physics: {
      width: 60,
      height: 30,
      collideWorldBounds: true,
      offsetX: 0, // 직접 조정
      offsetY: 30, // 직접 조정
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
      attack: '/assets/enemy/canine/Canine_White_Attack.png',
    },

    animations: {
      idle: { start: 0, end: 5, frameRate: 8, repeat: -1 },
      hit: { start: 0, end: 2, frameRate: 10, repeat: 0 },
      death: { start: 0, end: 7, frameRate: 10, repeat: 0 },
      attack: { start: 0, end: 7, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'patrol',
      detectRange: 200,
      attack: {
        range: 70,
        damage: 1,
        cooldown: 1500,
        hitDelay: 200,
      },
    },
  },

  bat: {
    type: 'normal',

    sprite: {
      frameWidth: 64,
      frameHeight: 64,
      scale: 1.8,
      flipX: false,
    },

    physics: {
      width: 25,
      height: 20,
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
      attack: '/assets/enemy/bat/Bat_Spiked_Attack.png',
    },

    animations: {
      idle: { start: 0, end: 4, frameRate: 10, repeat: -1 },
      hit: { start: 0, end: 2, frameRate: 12, repeat: 0 },
      death: { start: 0, end: 5, frameRate: 12, repeat: 0 },
      attack: { start: 0, end: 3, frameRate: 12, repeat: 0 },
    },

    ai: {
      type: 'patrol',
      detectRange: 250,
      attack: {
        range: 50,
        damage: 1,
        cooldown: 1200,
        hitDelay: 150,
      },
    },
  },

  purple_monkey: {
    type: 'normal',

    sprite: {
      frameWidth: 32,
      frameHeight: 32,
      scale: 2,
      flipX: true,
    },

    physics: {
      width: 26,
      height: 15,
      collideWorldBounds: true,
      offsetX: 5, // 직접 조정
      offsetY: 18, // 직접 조정
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
      attack: '/assets/enemy/purple_monkey/Purple_Monkey_Attack.png',
    },

    animations: {
      idle: { start: 0, end: 6, frameRate: 8, repeat: -1 },
      hit: { start: 0, end: 3, frameRate: 10, repeat: 0 },
      death: { start: 0, end: 8, frameRate: 10, repeat: 0 },
      attack: { start: 0, end: 4, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'patrol',
      detectRange: 200,
      attack: {
        range: 70,
        damage: 1,
        cooldown: 1500,
        hitDelay: 200,
      },
    },
  },
};
