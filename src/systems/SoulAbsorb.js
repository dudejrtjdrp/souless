// SoulAbsorb.js
export default class SoulAbsorb {
  constructor(scene) {
    this.scene = scene;
  }

  // preload에서 호출
  static preload(scene) {
    // 본인의 spritesheet 경로와 프레임 크기에 맞게 수정
    scene.load.spritesheet('spirit', 'assets/effects/spirit.png', {
      frameWidth: 200,
      frameHeight: 200,
    });
  }

  // 애니메이션 생성 (create에서 한 번 호출)
  static createAnimations(scene) {
    if (!scene.anims.exists('spirit_idle')) {
      scene.anims.create({
        key: 'spirit_idle',
        frames: scene.anims.generateFrameNumbers('spirit', { start: 0, end: 21 }), // 프레임 수 맞게 조정
        frameRate: 22,
        repeat: -1,
      });
    }
  }

  // 영혼 생성 및 흡수 애니메이션
  spawnAndAbsorb(x, y, target, onComplete) {
    const spirit = this.scene.add.sprite(x, y, 'spirit');
    spirit.setScale(0.2);
    spirit.play('spirit_idle');
    spirit.setDepth(100);

    // 1단계: 제자리에서 반짝이며 대기 (0.5초)
    this.scene.time.delayedCall(500, () => {
      // 2단계: 플레이어에게 이동
      this.scene.tweens.add({
        targets: spirit,
        x: target.x,
        y: target.y,
        scale: 0.3,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          // 이동 중에도 타겟 위치 추적 (플레이어가 움직일 경우)
          if (target.sprite) {
            this.scene.tweens.getTweensOf(spirit)[0]?.updateTo('x', target.sprite.x, true);
            this.scene.tweens.getTweensOf(spirit)[0]?.updateTo('y', target.sprite.y, true);
          }
        },
        onComplete: () => {
          spirit.destroy();
          if (onComplete) onComplete();
        },
      });
    });

    return spirit;
  }
}
