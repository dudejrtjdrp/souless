import EnemyBase from './EnemyBase.js';

export default class Canine extends EnemyBase {
  constructor(scene, x, y, scale = 1, patrolRangeX = 100) {
    super(scene, x, y, 32, 32, patrolRangeX, 1);
    this.type = 'canine';

    this.sprite.setTexture('canine_idle');
    this.sprite.setScale(scale);

    // 체력바 depth
    this.hpBar.setDepth(this.scene.mapConfig.depths.enemy + 1);

    this.createAnimations();
    this.sprite.play(`${this.type}_idle`);
  }

  createAnimations() {
    const anims = [
      { key: `${this.type}_idle`, start: 0, end: 3, frameRate: 6, repeat: -1 },
      { key: `${this.type}_hit`, start: 0, end: 2, frameRate: 8, repeat: 0 },
      { key: `${this.type}_death`, start: 0, end: 4, frameRate: 0, repeat: 0 }, // 단일 spritesheet
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
