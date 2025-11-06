import EnemyBase from './EnemyBase.js';

export default class PurpleMonkey extends EnemyBase {
  constructor(scene, x, y, scale = 1) {
    const patrolRangeX = Phaser.Math.Between(200, 600);
    const speed = Phaser.Math.Between(55, 80);
    super(scene, x, y, 32, 32, patrolRangeX, speed, 1);
    this.type = 'purple_monkey';

    // sprite를 spritesheet로 생성
    this.sprite.destroy(); // 기존 rectangle 제거
    this.sprite = scene.physics.add.sprite(x, y, 'purple_monkey_idle', 0);
    // this.sprite.flipX = true;
    this.sprite.setScale(scale * 2);
    this.sprite.scaleX = -Math.abs(this.sprite.scaleX);

    this.sprite.setDepth(this.scene.mapConfig.depths.enemy);

    // 체력바 depth
    this.hpBar.setDepth(this.scene.mapConfig.depths.enemy + 1);

    this.createAnimations();
    this.sprite.play(`${this.type}_idle`);
  }

  static preload(scene) {
    scene.load.spritesheet(
      'purple_monkey_hit',
      '/assets/enemy/purple_monkey/Purple_Monkey_Hit.png',
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    scene.load.spritesheet(
      'purple_monkey_death',
      '/assets/enemy/purple_monkey/Purple_Monkey_Death.png',
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    scene.load.spritesheet(
      'purple_monkey_idle',
      '/assets/enemy/purple_monkey/Purple_Monkey_Run.png',
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  createAnimations() {
    const anims = [
      { key: `${this.type}_idle`, start: 0, end: 5, frameRate: 5, repeat: -1 },
      { key: `${this.type}_hit`, start: 0, end: 0, frameRate: 1, repeat: 0 },
      { key: `${this.type}_death`, start: 0, end: 5, frameRate: 6, repeat: 0 },
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
