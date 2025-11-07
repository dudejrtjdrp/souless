import CharacterBase from '../base/CharacterBase.js';

export default class Monk extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = {
      spriteKey: 'monk',
      scale: options.scale || 1,
      walkSpeed: options.walkSpeed || 200,
      runSpeed: options.runSpeed || 350,
      jumpPower: options.jumpPower || 300,
      maxJumps: options.maxJumps || 2,
      bodySize: { width: 24, height: 30 },
      bodyOffset: { x: 4, y: 2 },
      attackHitbox: { width: 40, height: 30 },
      attackDuration: 500,
      attackOffset: { x: 30, y: 0 },
    };

    super(scene, x, y, config);

    this.walkTween = null;
    this.isJumping = false;
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
        // 대기 (idle)
        { key: 'idle', frames: { start: 0, end: 5 }, frameRate: 8, repeat: -1 },

        // 걷기 (walk)
        { key: 'walk', frames: { start: 26, end: 31 }, frameRate: 8, repeat: -1 },

        // 달리기 (run)
        { key: 'run', frames: { start: 26, end: 31 }, frameRate: 12, repeat: -1 },

        // 점프 상승 (jump)
        { key: 'jump', frames: { start: 51, end: 52 }, frameRate: 4, repeat: 0 },

        // 점프 하강 (jump_down)
        { key: 'jump_down', frames: { start: 76, end: 77 }, frameRate: 4, repeat: 0 },

        // 공중 공격 (air_attack)
        { key: 'air_attack', frames: { start: 101, end: 107 }, frameRate: 12, repeat: 0 },

        // 1타 공격
        { key: 'attack', frames: { start: 126, end: 130 }, frameRate: 6, repeat: 0 },

        // 2타 공격
        { key: 'attack_2', frames: { start: 38, end: 41 }, frameRate: 12, repeat: 0 },

        // 3타 공격
        { key: 'attack_3', frames: { start: 42, end: 45 }, frameRate: 12, repeat: 0 },

        // 특수 공격 (SP)
        { key: 'special_attack', frames: { start: 46, end: 49 }, frameRate: 12, repeat: 0 },

        // 명상 (Meditate)
        { key: 'meditate', frames: { start: 50, end: 53 }, frameRate: 6, repeat: -1 },

        // 구르기 (Roll)
        { key: 'roll', frames: { start: 54, end: 57 }, frameRate: 10, repeat: 0 },

        // 방어 (Defend)
        { key: 'defend', frames: { start: 58, end: 61 }, frameRate: 8, repeat: -1 },

        // 피격 (Take hit)
        { key: 'take_hit', frames: { start: 62, end: 65 }, frameRate: 8, repeat: 0 },

        // 죽음 (Death)
        { key: 'death', frames: { start: 66, end: 71 }, frameRate: 6, repeat: 0 },
      ],
    };
  }

  startWalkTween() {
    // if (this.walkTween) return;
    // this.walkTween = this.scene.tweens.add({
    //   targets: this,
    //   y: '+=1',
    //   duration: 250,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: 'Sine.easeInOut',
    // });
  }

  stopWalkTween() {
    // if (this.walkTween) {
    //   this.walkTween.stop();
    //   this.walkTween = null;
    //   this.sprite.y = this.baseY;
    // }
  }

  onStateChange(oldState, newState) {
    if (newState === 'walk' || newState === 'run') {
      this.startWalkTween();
    } else {
      this.stopWalkTween();
    }

    // 점프 상태 추적
    if (newState === 'jump') {
      this.isJumping = true;
    } else if (oldState === 'jump') {
      this.isJumping = false;
    }
  }

  // 기존 GameScene과 호환되는 메서드들
  changeState(state) {
    this.stateMachine.changeState(state);
  }

  onUpdate(input) {
    // Soul 전용 로직
  }

  destroy() {
    this.stopWalkTween();
    super.destroy();
  }
}
