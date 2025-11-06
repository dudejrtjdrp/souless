// characters/systems/AnimationManager.js
export default class AnimationManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
  }

  createAll() {
    const { spriteKey, animations } = this.config;

    animations.forEach((anim) => {
      // 이미 존재하는 애니메이션은 건너뛰기
      const animKey = `${spriteKey}-${anim.key}`;

      if (this.scene.anims.exists(animKey)) {
        return;
      }

      // 애니메이션 생성
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(spriteKey, {
          start: anim.frames.start,
          end: anim.frames.end,
        }),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    });
  }

  play(sprite, animKey) {
    const fullKey = `${this.config.spriteKey}-${animKey}`;

    // 애니메이션이 존재하는지 확인
    if (!this.scene.anims.exists(fullKey)) {
      console.error(`Animation not found: ${fullKey}`);
      return;
    }

    // 이미 같은 애니메이션이 재생 중이면 무시
    if (sprite.anims.currentAnim?.key === fullKey && sprite.anims.isPlaying) {
      return;
    }

    sprite.play(fullKey, true);
  }

  stop(sprite) {
    sprite.anims.stop();
  }

  exists(animKey) {
    const fullKey = `${this.config.spriteKey}-${animKey}`;
    return this.scene.anims.exists(fullKey);
  }
}
