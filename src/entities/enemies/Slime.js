import EnemyBase from './EnemyBase.js';

export default class Slime extends EnemyBase {
  constructor(scene, x, y, scale = 1) {
    const patrolRangeX = Phaser.Math.Between(100, 300);
    const speed = Phaser.Math.Between(10, 25); // Canine 고정 속도
    super(scene, x, y, 32, 32, patrolRangeX, speed, 1);
    this.type = 'slime';

    this.sprite.setTexture('slime_idle');
    this.sprite.setScale(scale);
    // 체력바 depth
    this.hpBar.setDepth(this.scene.mapConfig.depths.enemy + 1);

    this.createAnimations();
    this.sprite.play(`${this.type}_idle`);
  }

  static preload(scene) {
    scene.load.spritesheet('slime_idle', '/assets/enemy/slime/Slime_Spiked_Idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('slime_hit', '/assets/enemy/slime/Slime_Spiked_Hit.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('slime_death', '/assets/enemy/slime/Slime_Spiked_Death.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  createAnimations() {
    const anims = [
      { key: `${this.type}_idle`, start: 0, end: 3, frameRate: 6, repeat: -1 },
      { key: `${this.type}_hit`, start: 0, end: 3, frameRate: 8, repeat: 0 },
      { key: `${this.type}_death`, start: 0, end: 5, frameRate: 8, repeat: 0 },
    ];

    anims.forEach((a) => {
      if (!this.scene.anims.exists(a.key)) {
        this.scene.anims.create({
          key: a.key,
          frames: this.scene.anims.generateFrameNumbers(a.key, { start: a.start, end: a.end }),
          frameRate: a.frameRate,
          repeat: a.repeat,
        });
      }
    });
  }
}
