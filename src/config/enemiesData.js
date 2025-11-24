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
      offsetX: 22,
      offsetY: 30,
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
      offsetX: 0,
      offsetY: 30,
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
        range: 40,
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
        range: 70,
        damage: 1,
        cooldown: 1200,
        hitDelay: 150,
      },
    },
  },

  monkey: {
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
      offsetX: 5,
      offsetY: 18,
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
        range: 50,
        damage: 1,
        cooldown: 1500,
        hitDelay: 200,
      },
    },
  },
  assassin_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 48,
      frameHeight: 48,
      scale: 4,
      flipX: true,
    },

    physics: {
      width: 20,
      height: 32,
      collideWorldBounds: true,
      offsetX: 14,
      offsetY: 16,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/assassin_boss/assassin_boss.png',
      walk: '/assets/boss/assassin_boss/assassin_boss.png',
      run: '/assets/boss/assassin_boss/assassin_boss.png',
      dash: '/assets/boss/assassin_boss/assassin_boss.png',
      hit: '/assets/boss/assassin_boss/assassin_boss.png',
      death: '/assets/boss/assassin_boss/assassin_boss.png',
      attack: '/assets/boss/assassin_boss/assassin_boss.png',
      skill1: '/assets/boss/assassin_boss/assassin_boss.png',
      skill2: '/assets/boss/assassin_boss/assassin_boss.png',
    },

    animations: {
      idle: { start: 0, end: 8, frameRate: 9, repeat: -1 },
      walk: { start: 9, end: 16, frameRate: 8, repeat: -1 },
      run: { start: 9, end: 16, frameRate: 14, repeat: -1 },
      dash: { start: 9, end: 16, frameRate: 14, repeat: 0 },
      hit: { start: 18, end: 20, frameRate: 6, repeat: 0 },
      death: { start: 72, end: 78, frameRate: 10, repeat: 0 },
      attack: { start: 63, end: 70, frameRate: 10, repeat: 0 },
      skill1: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 80, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리 (detectRange보다 작게)
        runRange: 250, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        // 단일 히트박스 → hitboxSequence로 변환
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 100,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: 'fire_knight_w_skill',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },
  bladekeeper_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 140,
      frameHeight: 93,
      scale: 2,
      flipX: false,
      flipOffsetX: 130,
    },

    physics: {
      width: 50,
      height: 60,
      collideWorldBounds: true,
      offsetX: 40,
      offsetY: 35,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      walk: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      run: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      dash: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      hit: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      death: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      attack: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      skill1: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
      skill2: '/assets/boss/bladekeeper_boss/bladekeeper_boss.png',
    },

    animations: {
      idle: { start: 0, end: 7, frameRate: 9, repeat: -1 },
      walk: { start: 8, end: 16, frameRate: 8, repeat: -1 },
      run: { start: 8, end: 16, frameRate: 14, repeat: -1 },
      dash: { start: 8, end: 16, frameRate: 14, repeat: 0 },
      hit: { start: 25, end: 27, frameRate: 4, repeat: 0 },
      death: { start: 29, end: 38, frameRate: 10, repeat: 0 },
      attack: { start: 17, end: 24, frameRate: 10, repeat: 0 },
      skill1: { start: 39, end: 47, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 80, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리 (detectRange보다 작게)
        runRange: 250, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 100,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },

  monk_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 200,
      frameHeight: 200,
      scale: 0.8,
      flipX: true,
      flipOffsetX: 130,
    },

    physics: {
      width: 120,
      height: 160,
      collideWorldBounds: true,
      offsetX: 40,
      offsetY: 15,
    },

    stats: {
      maxHP: 50,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/monk_boss/monk_boss.png',
      walk: '/assets/boss/monk_boss/monk_boss.png',
      run: '/assets/boss/monk_boss/monk_boss.png',
      dash: '/assets/boss/monk_boss/monk_boss.png',
      hit: '/assets/boss/monk_boss/monk_boss.png',
      death: '/assets/boss/monk_boss/monk_boss.png',
      attack: '/assets/boss/monk_boss/monk_boss.png',
      skill1: '/assets/boss/monk_boss/monk_boss.png',
      skill2: '/assets/boss/monk_boss/monk_boss.png',
    },

    animations: {
      idle: { start: 12, end: 16, frameRate: 6, repeat: -1 },
      walk: { start: 24, end: 29, frameRate: 6, repeat: -1 },
      run: { start: 24, end: 29, frameRate: 12, repeat: -1 },
      dash: { start: 24, end: 29, frameRate: 12, repeat: 0 },
      hit: { start: 18, end: 21, frameRate: 10, repeat: 0 },
      death: { start: 6, end: 11, frameRate: 10, repeat: 0 },
      attack: { start: 0, end: 4, frameRate: 8, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 80, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리 (detectRange보다 작게)
        runRange: 250, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 100,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },

  princess_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 192,
      frameHeight: 128,
      scale: 1.8,
      flipX: false,
    },

    physics: {
      width: 80,
      height: 90,
      collideWorldBounds: true,
      offsetX: 55,
      offsetY: 20,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/princess_boss/princess_boss.png',
      walk: '/assets/boss/princess_boss/princess_boss.png',
      run: '/assets/boss/princess_boss/princess_boss.png',
      dash: '/assets/boss/princess_boss/princess_boss.png',
      hit: '/assets/boss/princess_boss/princess_boss.png',
      death: '/assets/boss/princess_boss/princess_boss.png',
      attack: '/assets/boss/princess_boss/princess_boss.png',
      skill1: '/assets/boss/princess_boss/princess_boss.png',
      skill2: '/assets/boss/princess_boss/princess_boss.png',
    },

    animations: {
      idle: { start: 0, end: 5, frameRate: 6, repeat: -1 },
      walk: { start: 16, end: 25, frameRate: 10, repeat: -1 },
      run: { start: 16, end: 25, frameRate: 18, repeat: -1 },
      dash: { start: 16, end: 25, frameRate: 18, repeat: 0 },
      hit: { start: 48, end: 54, frameRate: 6, repeat: 0 },
      death: { start: 60, end: 71, frameRate: 10, repeat: 0 },
      attack: { start: 32, end: 45, frameRate: 16, repeat: 0 },
      skill1: { start: 39, end: 47, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 80, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리 (detectRange보다 작게)
        runRange: 250, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 100,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },

  fire_knight_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 288,
      frameHeight: 160,
      scale: 1.8,
      flipX: false,
    },

    physics: {
      width: 90,
      height: 90,
      collideWorldBounds: true,
      offsetX: 100,
      offsetY: 70,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/fire_boss/fire_boss.png',
      walk: '/assets/boss/fire_boss/fire_boss.png',
      run: '/assets/boss/fire_boss/fire_boss.png',
      dash: '/assets/boss/fire_boss/fire_boss.png',
      hit: '/assets/boss/fire_boss/fire_boss.png',
      death: '/assets/boss/fire_boss/fire_boss.png',
      attack: '/assets/boss/fire_boss/fire_boss.png',
      skill1: '/assets/boss/fire_boss/fire_boss.png',
      skill2: '/assets/boss/fire_boss/fire_boss.png',
    },

    animations: {
      idle: { start: 0, end: 5, frameRate: 6, repeat: -1 },
      walk: { start: 22, end: 33, frameRate: 12, repeat: -1 },
      run: { start: 22, end: 33, frameRate: 20, repeat: -1 },
      dash: { start: 22, end: 33, frameRate: 20, repeat: 0 },
      hit: { start: 66, end: 70, frameRate: 6, repeat: 0 },
      death: { start: 88, end: 109, frameRate: 22, repeat: 0 },
      attack: { start: 44, end: 58, frameRate: 16, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 200, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리
        runRange: 450, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 200,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 200,
              },
              damage: 5,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },

  mauler_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 128,
      frameHeight: 128,
      scale: 3,
      flipX: true,
    },

    physics: {
      width: 50,
      height: 40,
      collideWorldBounds: true,
      offsetX: 40,
      offsetY: 23,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/mauler_boss/mauler_boss_idle.png',
      walk: '/assets/boss/mauler_boss/mauler_boss_walk.png',
      run: '/assets/boss/mauler_boss/mauler_boss_walk.png',
      dash: '/assets/boss/mauler_boss/mauler_boss_walk.png',
      hit: '/assets/boss/mauler_boss/mauler_boss_hit.png',
      death: '/assets/boss/mauler_boss/mauler_boss_death.png',
      attack: '/assets/boss/mauler_boss/mauler_boss_attack.png',
    },

    animations: {
      idle: { start: 0, end: 26, frameRate: 20, repeat: -1 },
      walk: { start: 0, end: 33, frameRate: 12, repeat: -1 },
      run: { start: 0, end: 33, frameRate: 20, repeat: -1 },
      dash: { start: 0, end: 33, frameRate: 20, repeat: 0 },
      hit: { start: 0, end: 11, frameRate: 12, repeat: 0 },
      death: { start: 0, end: 66, frameRate: 67, repeat: 0 },
      attack: { start: 10, end: 41, frameRate: 30, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 100, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리
        runRange: 450, // 달리기 거리
      },

      skillNames: ['attack', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 100,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 160,
                offsetX: 95,
                offsetY: -40,
                duration: 400,
              },
              damage: 25,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },

  final_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 224,
      frameHeight: 240,
      scale: 3,
      flipX: true,
    },

    physics: {
      width: 215,
      height: 230,
      collideWorldBounds: true,
      offsetX: 5,
      offsetY: 0,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 120,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/final_boss/final_boss.png',
      walk: '/assets/boss/final_boss/final_boss.png',
      run: '/assets/boss/final_boss/final_boss.png',
      dash: '/assets/boss/final_boss/final_boss.png',
      hit: '/assets/boss/final_boss/final_boss.png',
      death: '/assets/boss/final_boss/final_boss.png',
      attack: '/assets/boss/final_boss/final_boss.png',
    },

    animations: {
      idle: { start: 0, end: 14, frameRate: 20, repeat: -1 },
      walk: { start: 0, end: 14, frameRate: 20, repeat: -1 },
      run: { start: 0, end: 14, frameRate: 20, repeat: -1 },
      dash: { start: 0, end: 14, frameRate: 20, repeat: 0 },
      hit: { start: 0, end: 14, frameRate: 20, repeat: 0 },
      death: { start: 0, end: 14, frameRate: 20, repeat: 0 },
      attack: { start: 10, end: 14, frameRate: 20, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 2000,

      maxPhase: 3, // 3페이즈
      phaseMaxHPs: {
        1: 500,
        2: 1000,
        3: 1500,
      },
      attack: {
        attackRange: 2000, // 멈추고 공격하는 거리
        walkRange: 0, // 걷기 거리
        runRange: 0, // 달리기 거리
      },

      skillNames: ['attack', 'explosion'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 2000,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 200,
              hitbox: {
                width: 80,
                height: 160,
                offsetX: 95,
                offsetY: -40,
                duration: 400,
              },
              damage: 25,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: '',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        // 단일 히트박스 → hitboxSequence로 변환
        explosion: {
          type: 'melee',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 500,
          priority: 3,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: -500,
                offsetY: 340,
                duration: 500,
              },
              damage: 0.001,
              knockback: { x: 50, y: 0 },
            },
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: -200,
                offsetY: 340,
                duration: 500,
              },
              damage: 0.001,
              knockback: { x: 50, y: 0 },
            },
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 100,
                offsetY: 340,
                duration: 500,
              },
              damage: 0.001,
              knockback: { x: 50, y: 0 },
            },
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 300,
                offsetY: 340,
                duration: 500,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 300,
                offsetY: 340,
                duration: 500,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
              effect: '',
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',
        },
      },
    },
  },

  semi_boss: {
    type: 'boss',

    sprite: {
      frameWidth: 250,
      frameHeight: 250,
      scale: 1.8,
      flipX: true,
    },

    physics: {
      width: 60,
      height: 100,
      collideWorldBounds: true,
      offsetX: 90,
      offsetY: 70,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      runSpeed: 200,
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/boss/semi_boss/semi_boss.png',
      walk: '/assets/boss/semi_boss/semi_boss.png',
      run: '/assets/boss/semi_boss/semi_boss.png',
      dash: '/assets/boss/semi_boss/semi_boss.png',
      hit: '/assets/boss/semi_boss/semi_boss.png',
      death: '/assets/boss/semi_boss/semi_boss.png',
      attack: '/assets/boss/semi_boss/semi_boss.png',
      skill: '/assets/boss/semi_boss/semi_boss.png',
    },

    animations: {
      idle: { start: 0, end: 7, frameRate: 6, repeat: -1 },
      walk: { start: 8, end: 15, frameRate: 8, repeat: -1 },
      run: { start: 8, end: 15, frameRate: 16, repeat: -1 },
      dash: { start: 8, end: 15, frameRate: 16, repeat: 0 },
      hit: { start: 32, end: 34, frameRate: 6, repeat: 0 },
      death: { start: 40, end: 46, frameRate: 7, repeat: 0 },
      attack: { start: 24, end: 31, frameRate: 10, repeat: 0 },
      skill: { start: 16, end: 23, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        attackRange: 150, // 멈추고 공격하는 거리
        walkRange: 1200, // 걷기 거리
        runRange: 1050, // 달리기 거리
      },

      maxPhase: 2, // 2페이즈
      phaseThresholds: [0.5], // HP 50%에서 2페이즈 시작

      skillNames: ['attack', 'soulBall', 'shadowDash'],

      skills: {
        attack: {
          type: 'melee',
          animation: 'attack',
          range: 150,
          cooldown: 1000,
          hitDelay: 100,
          duration: 500,
          priority: 2,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 200,
              hitbox: {
                width: 200,
                height: 200,
                offsetX: 175,
                offsetY: 20,
                duration: 500,
              },
              damage: 25,
              knockback: { x: 30, y: 150 },
            },
            {
              delay: 400,
              hitbox: {
                width: 80,
                height: 140,
                offsetX: 155,
                offsetY: 20,
                duration: 400,
              },
              damage: 15,
              knockback: { x: 30, y: 150 },
            },
          ],

          impactEffect: 'semi_boss_default_attack',
          hitstop: 'BOSS_HEAVY',
          targetType: 'single',
        },

        soulBall: {
          type: 'instant',
          animation: 'skill',
          range: 850,
          cooldown: 3000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 100,
              hitbox: {
                width: 200,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 700,
                effect: 'semi_boss_default_skill',
              },
              movement: { distanceX: 500, distanceY: 0, duration: 700 },
              damage: 0.5,
              knockback: { x: 50, y: 0 },
            },
            {
              delay: 700,
              hitbox: {
                width: 200,
                height: 200,
                offsetX: 545,
                offsetY: 40,
                duration: 400,
                effect: 'semi_boss_default_skill_effect',
              },
              damage: 20,
              knockback: { x: 50, y: 50 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',
        },

        shadowDash: {
          type: 'movement',
          animation: 'dash',
          range: 350,
          cooldown: 6000,
          hitDelay: 100,
          duration: 300,
          priority: 1,
          turnDelay: 200,

          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 80,
                height: 150,
                offsetX: 45,
                offsetY: 40,
                duration: 100,
              },
              damage: 0.2,
              knockback: { x: 50, y: 0 },
            },
          ],

          impactEffect: '',
          hitstop: 'light',
          targetType: 'multi',

          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },
      },
    },
  },
};
