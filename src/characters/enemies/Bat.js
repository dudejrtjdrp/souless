import EnemyBase from './EnemyBase.js';

export default class Bat extends EnemyBase {
  constructor(scene, x, y, scale = 1) {
    const patrolRangeX = Phaser.Math.Between(300, 700);
    const speed = Phaser.Math.Between(50, 70); // Bat 랜덤 속도
    super(scene, x, y, 32, 32, patrolRangeX, speed, 1);
    this.type = 'bat';

    // sprite를 spritesheet로 생성
    this.sprite.destroy(); // 기존 rectangle 제거
    this.sprite = scene.physics.add.sprite(x, y, 'bat_idle', 0);
    this.sprite.setScale(scale);
    this.sprite.setDepth(this.scene.mapConfig.depths.enemy);

    // 체력바 depth
    this.hpBar.setDepth(this.scene.mapConfig.depths.enemy + 1);

    this.createAnimations();
    this.sprite.play(`${this.type}_idle`);
  }

  static preload(scene) {
    scene.load.spritesheet('bat_idle', '/assets/enemy/bat/Bat_Spiked_Idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('bat_hit', '/assets/enemy/bat/Bat_Spiked_Hit.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('bat_death', '/assets/enemy/bat/Bat_Spiked_Death.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  createAnimations() {
    const anims = [
      { key: `${this.type}_idle`, start: 0, end: 4, frameRate: 6, repeat: -1 },
      { key: `${this.type}_hit`, start: 0, end: 4, frameRate: 8, repeat: 0 },
      { key: `${this.type}_death`, start: 0, end: 6, frameRate: 8, repeat: 0 },
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
