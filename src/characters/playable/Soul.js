// characters/playable/Soul.js
import CharacterBase from '../base/CharacterBase.js';

export default class Soul extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = {
      spriteKey: 'soul',
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
    scene.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  getAnimationConfig() {
    return {
      spriteKey: 'soul',
      animations: [
        {
          key: 'idle',
          frames: { start: 0, end: 1 },
          frameRate: 3,
          repeat: -1,
        },
        {
          key: 'walk',
          frames: { start: 25, end: 32 },
          frameRate: 6,
          repeat: -1,
        },
        {
          key: 'run',
          frames: { start: 25, end: 32 },
          frameRate: 10,
          repeat: -1,
        },
        {
          key: 'jump',
          frames: { start: 41, end: 48 },
          frameRate: 8,
          repeat: 0,
        },
        {
          key: 'attack',
          frames: { start: 65, end: 71 },
          frameRate: 12,
          repeat: 0,
        },
      ],
    };
  }

  startWalkTween() {
    if (this.walkTween) return;

    this.walkTween = this.scene.tweens.add({
      targets: this.sprite,
      y: `+=1`,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopWalkTween() {
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
      this.sprite.y = this.baseY;
    }
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
