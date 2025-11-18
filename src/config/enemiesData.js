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
        range: 50,
        damage: 1,
        cooldown: 1500,
        hitDelay: 200,
      },
    },
  },
  fireBoss: {
    type: 'boss',

    sprite: {
      frameWidth: 128,
      frameHeight: 128,
      scale: 2,
      flipX: false,
    },

    physics: {
      width: 100,
      height: 80,
      collideWorldBounds: true,
      offsetX: 14,
      offsetY: 40,
    },

    stats: {
      maxHP: 500,
      speed: { min: 50, max: 50 },
      patrolRange: { min: 0, max: 0 }, // 보스는 패트롤 안 함
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/enemy/boss/fire/Fire_Boss_Idle.png',
      hit: '/assets/enemy/boss/fire/Fire_Boss_Hit.png',
      death: '/assets/enemy/boss/fire/Fire_Boss_Death.png',
      attack: '/assets/enemy/boss/fire/Fire_Boss_Attack.png',
      skill1: '/assets/enemy/boss/fire/Fire_Boss_Skill1.png',
      skill2: '/assets/enemy/boss/fire/Fire_Boss_Skill2.png',
    },

    animations: {
      idle: { start: 0, end: 5, frameRate: 8, repeat: -1 },
      hit: { start: 0, end: 2, frameRate: 10, repeat: 0 },
      death: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      attack: { start: 0, end: 7, frameRate: 10, repeat: 0 },
      skill1: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 500,
      attack: {
        range: 100,
        damage: 15,
        cooldown: 2000,
        hitDelay: 300,
      },
      skillCooldown: 3000, // BossController에서 사용
      skillNames: ['fireSlash', 'meteorStrike'], // BossController에서 랜덤 선택
      skills: [
        {
          name: 'fireSlash',
          type: 'melee',
          animationKey: 'fireBoss_skill1',
          damage: 25,
          range: 150,
          cooldown: 4000,
          hitDelay: 400,
          priority: 2,
        },
        {
          name: 'meteorStrike',
          type: 'aoe',
          animationKey: 'fireBoss_skill2',
          damage: 30,
          range: 300,
          cooldown: 6000,
          hitDelay: 600,
          priority: 3,
          createAoE: (enemy, player, scene) => {
            // AOE 이펙트 생성 로직
            const aoeRadius = 150;
            const aoeGraphics = scene.add.circle(
              player.sprite.x,
              player.sprite.y,
              aoeRadius,
              0xff0000,
              0.3,
            );

            scene.time.delayedCall(500, () => {
              const dist = Phaser.Math.Distance.Between(
                player.sprite.x,
                player.sprite.y,
                aoeGraphics.x,
                aoeGraphics.y,
              );
              if (dist <= aoeRadius) {
                player.takeDamage(30);
              }
              aoeGraphics.destroy();
            });
          },
        },
      ],
    },
  },

  // 예시: 얼음 보스 (마법사 전직용)
  iceBoss: {
    type: 'boss',

    sprite: {
      frameWidth: 128,
      frameHeight: 128,
      scale: 2,
      flipX: false,
    },

    physics: {
      width: 100,
      height: 80,
      collideWorldBounds: true,
      offsetX: 14,
      offsetY: 40,
    },

    stats: {
      maxHP: 450,
      speed: { min: 40, max: 40 },
      patrolRange: { min: 0, max: 0 },
      expReward: 100,
      damageCooldown: 300,
    },

    assets: {
      idle: '/assets/enemy/boss/ice/Ice_Boss_Idle.png',
      hit: '/assets/enemy/boss/ice/Ice_Boss_Hit.png',
      death: '/assets/enemy/boss/ice/Ice_Boss_Death.png',
      attack: '/assets/enemy/boss/ice/Ice_Boss_Attack.png',
      skill1: '/assets/enemy/boss/ice/Ice_Boss_Skill1.png',
      skill2: '/assets/enemy/boss/ice/Ice_Boss_Skill2.png',
    },

    animations: {
      idle: { start: 0, end: 5, frameRate: 8, repeat: -1 },
      hit: { start: 0, end: 2, frameRate: 10, repeat: 0 },
      death: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      attack: { start: 0, end: 7, frameRate: 10, repeat: 0 },
      skill1: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 500,
      attack: {
        range: 80,
        damage: 12,
        cooldown: 2000,
        hitDelay: 300,
      },
      skillCooldown: 3500,
      skillNames: ['iceSpike', 'blizzard'],
      skills: [
        {
          name: 'iceSpike',
          type: 'projectile',
          animationKey: 'iceBoss_skill1',
          damage: 20,
          range: 400,
          cooldown: 4000,
          hitDelay: 400,
          priority: 2,
          createProjectile: (enemy, player, scene) => {
            const projectile = scene.physics.add.sprite(enemy.x, enemy.y, 'iceSpike');

            const angle = Phaser.Math.Angle.Between(
              enemy.x,
              enemy.y,
              player.sprite.x,
              player.sprite.y,
            );

            scene.physics.velocityFromRotation(angle, 300, projectile.body.velocity);

            scene.physics.add.overlap(projectile, player.sprite, () => {
              player.takeDamage(20);
              projectile.destroy();
            });

            scene.time.delayedCall(3000, () => {
              if (projectile) projectile.destroy();
            });
          },
        },
        {
          name: 'blizzard',
          type: 'aoe',
          animationKey: 'iceBoss_skill2',
          damage: 15,
          range: 500,
          cooldown: 7000,
          hitDelay: 600,
          priority: 3,
          createAoE: (enemy, player, scene) => {
            // 전체 화면 블리자드
            for (let i = 0; i < 5; i++) {
              scene.time.delayedCall(i * 300, () => {
                const randomX = player.sprite.x + Phaser.Math.Between(-200, 200);
                const randomY = player.sprite.y + Phaser.Math.Between(-150, 150);

                const ice = scene.add.circle(randomX, randomY, 30, 0x00ffff, 0.5);

                scene.time.delayedCall(200, () => {
                  const dist = Phaser.Math.Distance.Between(
                    player.sprite.x,
                    player.sprite.y,
                    ice.x,
                    ice.y,
                  );
                  if (dist <= 30) {
                    player.takeDamage(15);
                  }
                  ice.destroy();
                });
              });
            }
          },
        },
      ],
    },
  },
};
