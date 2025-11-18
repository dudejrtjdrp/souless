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
      hit: { start: 18, end: 20, frameRate: 2, repeat: 0 },
      death: { start: 72, end: 78, frameRate: 10, repeat: 0 },
      attack: { start: 63, end: 70, frameRate: 10, repeat: 0 },
      skill1: { start: 0, end: 9, frameRate: 10, repeat: 0 },
      skill2: { start: 0, end: 11, frameRate: 10, repeat: 0 },
    },

    ai: {
      type: 'boss',
      detectRange: 1200,

      attack: {
        range: 100,
        damage: 15,
        walkRange: 1200,
        runRange: 500,
        cooldown: 2000,
        hitDelay: 300,
      },

      skillCooldown: 4000,
      skillNames: ['fireSlash', 'meteorStrike', 'shadowDash'],

      // ✅ 객체 형태 (플레이어와 동일)
      skills: {
        fireSlash: {
          type: 'melee',
          animation: 'skill1',
          damage: 25,
          range: 150,
          cooldown: 5000,
          hitDelay: 400,
          duration: 800,
          priority: 2,

          hitbox: {
            width: 150,
            height: 80,
            offsetX: 75,
            offsetY: 0,
            duration: 300,
          },

          impactEffect: 'slash_impact',
          hitstop: 'medium',
          knockback: { x: 200, y: -100 },
          targetType: 'single',
        },

        meteorStrike: {
          type: 'aoe',
          animation: 'skill2',
          damage: 30,
          range: 300,
          cooldown: 8000,
          hitDelay: 800,
          duration: 1500,
          priority: 3,
          hpThreshold: 0.5, // 체력 50% 이하

          hitbox: {
            width: 300,
            height: 300,
            offsetX: 0,
            offsetY: 0,
            duration: 500,
            shape: 'circle',
          },

          aoeRadius: 150,
          impactEffect: 'meteor_explosion',
          hitstop: 'heavy',
          targetType: 'multi',

          // ✅ 함수 대신 설정값으로 처리
          visualEffect: {
            type: 'warning_then_explosion',
            warningDuration: 800,
            warningColor: 0xff0000,
            explosionColor: 0xff4500,
            shake: { duration: 200, intensity: 0.005 },
          },
        },

        shadowDash: {
          type: 'movement',
          animation: 'attack',
          damage: 20,
          range: 250,
          cooldown: 6000,
          hitDelay: 100,
          duration: 600,
          priority: 1,

          hitbox: {
            width: 120,
            height: 60,
            offsetX: 60,
            offsetY: 0,
            duration: 500,
          },

          impactEffect: 'dash_trail',
          hitstop: 'light',
          knockback: { x: 300, y: 0 },
          targetType: 'multi',

          // ✅ 대시 설정
          movement: {
            type: 'dash',
            speed: 500,
            duration: 500,
            afterimage: true,
            afterimageCount: 3,
          },
        },

        // 콤보 스킬 예시
        tripleSlash: {
          type: 'instant',
          animation: 'attack',
          cooldown: 7000,
          hitDelay: 300,
          duration: 1200,
          priority: 2,
          range: 150,

          // ✅ 히트박스 시퀀스 (플레이어와 동일)
          hitboxSequence: [
            {
              delay: 0,
              hitbox: {
                width: 100,
                height: 70,
                offsetX: 50,
                offsetY: 0,
                duration: 200,
              },
              damage: 15,
            },
            {
              delay: 300,
              hitbox: {
                width: 120,
                height: 80,
                offsetX: 60,
                offsetY: 0,
                duration: 200,
              },
              damage: 15,
            },
            {
              delay: 600,
              hitbox: {
                width: 150,
                height: 90,
                offsetX: 75,
                offsetY: 0,
                duration: 300,
              },
              damage: 20,
            },
          ],

          impactEffect: 'slash_combo',
          hitstop: 'combo',
          knockback: { x: 400, y: -150 },
          targetType: 'multi',
        },

        // 버프 스킬 예시
        berserkerMode: {
          type: 'buff',
          animation: 'idle',
          range: Infinity,
          cooldown: 20000,
          duration: 5000,
          priority: 4,
          hpThreshold: 0.3, // 체력 30% 이하

          // ✅ 버프 효과
          buffs: {
            speed: 1.5, // 속도 1.5배
            defense: 0.5, // 받는 데미지 50%
            attackSpeed: 1.3, // 공격속도 1.3배
          },

          // 버프 시각 효과
          visualEffect: {
            type: 'aura',
            color: 0xff0000,
            alpha: 0.3,
            scale: 1.2,
            pulse: true,
          },
        },
      },
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
