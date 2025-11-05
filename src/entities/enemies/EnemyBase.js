import Phaser from 'phaser';

export default class EnemyBase {
  constructor(scene, x, y, spriteKey, scale = 1, patrolRangeX = 0) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, spriteKey);
    this.sprite.setScale(scale);
    this.sprite.setCollideWorldBounds(true);

    this.startX = x;
    this.patrolRangeX = patrolRangeX;
    this.speed = 50 + Math.random() * 50;
    this.direction = Math.random() < 0.5 ? -1 : 1;
  }

  update(time, delta) {
    if (this.patrolRangeX > 0) {
      this.sprite.x += (this.speed * this.direction * delta) / 1000;
      if (
        this.sprite.x < this.startX - this.patrolRangeX ||
        this.sprite.x > this.startX + this.patrolRangeX
      ) {
        this.direction *= -1;
      }
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
