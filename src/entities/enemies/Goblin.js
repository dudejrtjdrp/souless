import Phaser from 'phaser';

export default class Goblin {
  constructor(scene, x, y, scale = 1, patrolRangeX = 100) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, null); // 아직 스프라이트 없으면 null
    this.sprite.setDisplaySize(32, 32); // placeholder 사각형
    this.sprite.setCollideWorldBounds(true);

    this.patrolRangeX = patrolRangeX;
    this.originX = x;
    this.speed = 40;
    this.direction = 1;
  }

  update() {
    // 단순 좌우 패트롤
    this.sprite.setVelocityX(this.speed * this.direction);
    if (Math.abs(this.sprite.x - this.originX) >= this.patrolRangeX) {
      this.direction *= -1;
    }
  }

  takeDamage(amount = 1) {
    this.hp = (this.hp ?? 3) - amount;
    if (this.hp <= 0) {
      this.isDead = true;
      this.sprite.destroy();
    }
  }
}
