import EnemyBase from './EnemyBase.js';

export default class Canine extends EnemyBase {
  constructor(scene, x, y, scale = 1) {
    const patrolRangeX = Phaser.Math.Between(300, 500);
    const speed = Phaser.Math.Between(35, 60); // Canine 고정 속도
    super(scene, x, y, 32, 32, patrolRangeX, speed, 1);
    this.type = 'canine';

    // sprite를 spritesheet로 생성
    this.sprite.destroy(); // 기존 rectangle 제거
    this.sprite = scene.physics.add.sprite(x, y, 'canine_idle', 0);
    this.sprite.setScale(scale);
    this.sprite.setDepth(this.scene.mapConfig.depths.enemy);

    // 체력바 depth
    this.hpBar.setDepth(this.scene.mapConfig.depths.enemy + 1);

    this.createAnimations();
    this.sprite.play(`${this.type}_idle`);
  }

  static preload(scene) {
    scene.load.spritesheet('canine_hit', '/assets/enemy/canine/Canine_White_Hit.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('canine_death', '/assets/enemy/canine/Canine_White_Death.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('canine_idle', '/assets/enemy/canine/Canine_White_Run.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  createAnimations() {
    const anims = [
      { key: `${this.type}_idle`, start: 0, end: 5, frameRate: 5, repeat: -1 },
      // { key: `${this.type}_run`, start: 0, end: 5, frameRate: 7, repeat: -1 },
      { key: `${this.type}_hit`, start: 0, end: 3, frameRate: 8, repeat: 0 },
      { key: `${this.type}_death`, start: 0, end: 7, frameRate: 8, repeat: 0 },
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
