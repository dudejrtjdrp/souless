import CharacterBase from '../base/CharacterBase.js';
import HitboxConfig from '../systems/HitBoxConfig.js';

export default class Soul extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = {
      spriteKey: 'soul',

      // 시각적 크기 조정
      spriteScale: options.spriteScale || 2.0,

      // 충돌 박스 설정 (절대 픽셀 크기)
      collisionBox: HitboxConfig.createCollisionBox(
        32, // width - Soul과 동일
        64, // height - Soul과 동일
        16, // offsetX - 캐릭터 중앙에 맞게 조정
        0, // offsetY - 발 위치에 맞게 조정
      ),

      // 기본 공격 히트박스
      attackHitbox: HitboxConfig.createAttackHitbox(
        50, // width - Monk는 조금 더 넓게
        35, // height
        35, // offsetX - 앞쪽으로
        0, // offsetY - 중앙
        500, // duration (ms)
      ),

      // 디버그 모드
      debug: false,

      // 이동 설정
      walkSpeed: options.walkSpeed || 200,
      runSpeed: options.runSpeed || 350,
      jumpPower: options.jumpPower || 300,
      maxJumps: options.maxJumps || 2,

      // 공격 설정
      attackDuration: 500,
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
        { key: 'idle', frames: { start: 0, end: 1 }, frameRate: 3, repeat: -1 },
        { key: 'walk', frames: { start: 25, end: 32 }, frameRate: 6, repeat: -1 },
        { key: 'run', frames: { start: 25, end: 32 }, frameRate: 10, repeat: -1 },
        { key: 'jump', frames: { start: 41, end: 48 }, frameRate: 8, repeat: 0 },
        { key: 'attack', frames: { start: 65, end: 71 }, frameRate: 12, repeat: 0 },
      ],
    };
  }

  startWalkTween() {
    if (this.walkTween) return;

    // this.walkTween = this.scene.tweens.add({
    //   targets: this.sprite,
    //   y: `+=1`,
    //   duration: 250,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: 'Sine.easeInOut',
    // });
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

    if (newState === 'jump') {
      this.isJumping = true;
    } else if (oldState === 'jump') {
      this.isJumping = false;
    }
  }

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
