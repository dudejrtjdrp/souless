export default class Enemy {
  constructor(scene, x, y, scale = 1, patrolRangeX = 50) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
    this.sprite.setScale(scale);
    this.sprite.setCollideWorldBounds(true);

    this.alive = true;
    this.hp = 1;
    this.patrolRangeX = patrolRangeX;
    this.originX = x;
    this.speed = 30;
    this.direction = 1;
  }

  update(time, delta) {
    if (!this.alive) return;
    this.sprite.setVelocityX(this.speed * this.direction);

    // 패트롤 범위
    if (this.sprite.x > this.originX + this.patrolRangeX) this.direction = -1;
    else if (this.sprite.x < this.originX - this.patrolRangeX) this.direction = 1;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.sprite.destroy();
  }
}
