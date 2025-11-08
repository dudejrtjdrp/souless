import CharacterBase from '../base/CharacterBase.js';
import HitboxConfig from '../systems/HitBoxConfig.js';

export default class Monk extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = {
      spriteKey: 'monk',

      // 시각적 크기 조정
      spriteScale: options.spriteScale || 2.0,

      // 충돌 박스 설정 (절대 픽셀 크기)
      collisionBox: HitboxConfig.createCollisionBox(
        46, // width - Soul과 동일
        76, // height - Soul과 동일
        268, // offsetX - 캐릭터 중앙에 맞게 조정
        170, // offsetY - 발 위치에 맞게 조정
      ),

      // 기본 공격 히트박스
      attackHitbox: HitboxConfig.createAttackHitbox(
        50, // width - Monk는 조금 더 넓게
        45, // height
        30, // offsetX - 앞쪽으로
        80, // offsetY - 중앙
        500, // duration (ms)
      ),

      // 스킬별 히트박스 설정
      skillHitboxes: {
        // 공중 공격
        air_attack: HitboxConfig.createSkillHitbox('air_attack', {
          size: { width: 60, height: 40 },
          offset: { x: 30, y: 10 },
          duration: 400,
          damage: 15,
          knockback: { x: 150, y: -100 },
        }),

        // 2타 공격
        attack_2: HitboxConfig.createSkillHitbox('attack_2', {
          size: { width: 55, height: 35 },
          offset: { x: 40, y: 0 },
          duration: 450,
          damage: 12,
        }),

        // 3타 공격 (피니셔)
        attack_3: HitboxConfig.createSkillHitbox('attack_3', {
          size: { width: 70, height: 45 },
          offset: { x: 45, y: 0 },
          duration: 600,
          damage: 20,
          knockback: { x: 200, y: -80 },
          effects: ['knockdown'],
        }),

        // 특수 공격 (SP)
        special_attack: HitboxConfig.createSkillHitbox('special_attack', {
          size: { width: 80, height: 50 },
          offset: { x: 50, y: 0 },
          duration: 700,
          damage: 30,
          knockback: { x: 250, y: -120 },
          effects: ['stun', 'burn'],
        }),

        // 구르기 (회피)
        roll: HitboxConfig.createSkillHitbox('roll', {
          size: { width: 30, height: 25 },
          offset: { x: 0, y: 0 },
          duration: 400,
          damage: 0, // 회피 기술
          invincible: true,
        }),
      },

      // 디버그 모드
      debug: true,

      // 이동 설정
      walkSpeed: options.walkSpeed || 200,
      runSpeed: options.runSpeed || 350,
      jumpPower: options.jumpPower || 300,
      maxJumps: options.maxJumps || 2,

      // 스폰 설정
      baseX: 100,
      baseY: 800,
    };

    super(scene, config.baseX, config.baseY, config);

    this.walkTween = null;
    this.isJumping = false;
    this.comboCount = 0; // 콤보 카운트
  }

  static preload(scene) {
    scene.load.spritesheet('monk', '/assets/characters/monk_spritesheet.png', {
      frameWidth: 288,
      frameHeight: 128,
    });
  }

  getAnimationConfig() {
    return {
      spriteKey: 'monk',
      animations: [
        { key: 'idle', frames: { start: 0, end: 5 }, frameRate: 8, repeat: -1 },
        { key: 'walk', frames: { start: 26, end: 31 }, frameRate: 8, repeat: -1 },
        { key: 'run', frames: { start: 26, end: 31 }, frameRate: 12, repeat: -1 },
        { key: 'jump', frames: { start: 51, end: 52 }, frameRate: 4, repeat: 0 },
        { key: 'jump_down', frames: { start: 76, end: 77 }, frameRate: 4, repeat: 0 },
        { key: 'air_attack', frames: { start: 101, end: 107 }, frameRate: 12, repeat: 0 },
        { key: 'attack', frames: { start: 126, end: 130 }, frameRate: 6, repeat: 0 },
        { key: 'attack_2', frames: { start: 38, end: 41 }, frameRate: 12, repeat: 0 },
        { key: 'attack_3', frames: { start: 42, end: 45 }, frameRate: 12, repeat: 0 },
        { key: 'special_attack', frames: { start: 46, end: 49 }, frameRate: 12, repeat: 0 },
        { key: 'meditate', frames: { start: 50, end: 53 }, frameRate: 6, repeat: -1 },
        { key: 'roll', frames: { start: 54, end: 57 }, frameRate: 10, repeat: 0 },
        { key: 'defend', frames: { start: 58, end: 61 }, frameRate: 8, repeat: -1 },
        { key: 'take_hit', frames: { start: 62, end: 65 }, frameRate: 8, repeat: 0 },
        { key: 'death', frames: { start: 66, end: 71 }, frameRate: 6, repeat: 0 },
      ],
    };
  }

  // ⭐ Monk 전용 스킬 사용
  performComboAttack() {
    this.comboCount = (this.comboCount + 1) % 3;

    switch (this.comboCount) {
      case 0:
        this.attack(); // 기본 공격
        break;
      case 1:
        this.useSkill('attack_2', 'attack_2'); // 2타
        break;
      case 2:
        this.useSkill('attack_3', 'attack_3'); // 3타 피니셔
        break;
    }
  }

  performAirAttack() {
    if (!this.movement.isOnGround()) {
      this.useSkill('air_attack', 'air_attack');
    }
  }

  performSpecialAttack() {
    this.useSkill('special_attack', 'special_attack');
  }

  performRoll() {
    this.useSkill('roll', 'roll');
  }

  startWalkTween() {
    // 필요시 구현
  }

  stopWalkTween() {
    // 필요시 구현
  }

  onStateChange(oldState, newState) {
    if (newState === 'walk' || newState === 'run') {
      this.startWalkTween();
    } else {
      this.stopWalkTween();
    }

    if (newState === 'jump') {
      this.isJumping = true;
    } else if (oldState === 'jump') {
      this.isJumping = false;
    }

    // 공격 애니메이션 종료 시 콤보 리셋
    if (oldState.includes('attack') && newState === 'idle') {
      this.scene.time.delayedCall(1000, () => {
        this.comboCount = 0;
      });
    }
  }

  changeState(state) {
    this.stateMachine.changeState(state);
  }

  onUpdate(input) {
    // Monk 전용 로직
    // 예: S키로 특수 공격
    // if (input.isSkillPressed) {
    //   this.performSpecialAttack();
    // }
  }

  destroy() {
    this.stopWalkTween();
    super.destroy();
  }
}
