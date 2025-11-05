import Phaser from 'phaser';

export default class EnemyBase {
  constructor(scene, x, y, width = 32, height = 32, patrolRangeX = 100, maxHP = 3) {
    this.scene = scene;
    this.patrolRangeX = patrolRangeX;
    this.startX = x;

    // 체력
    this.maxHP = maxHP;
    this.hp = maxHP;

    // placeholder rectangle
    this.sprite = scene.add.rectangle(x, y, width, height, 0xff0000);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    // 체력바
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 5, width, 5, 0x00ff00);
    this.hpBar.setOrigin(0.5, 0.5);

    // 이동
    this.direction = 1; // 오른쪽으로 시작
    this.speed = 50;
    this.sprite.body.setVelocityX(this.speed * this.direction);
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
    } else {
      this.updateHPBar();
    }
  }

  updateHPBar() {
    const width = (this.sprite.width * this.hp) / this.maxHP;
    this.hpBar.width = width;
  }

  update() {
    // patrol logic
    if (this.sprite.x >= this.startX + this.patrolRangeX) {
      this.direction = -1;
      this.sprite.body.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.x <= this.startX - this.patrolRangeX) {
      this.direction = 1;
      this.sprite.body.setVelocityX(this.speed * this.direction);
    }

    // HP바 위치 동기화
    this.hpBar.x = this.sprite.x;
    this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 5;
  }

  destroy() {
    this.sprite.destroy();
    this.hpBar.destroy();
  }
}
