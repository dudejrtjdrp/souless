// EnemyBase.js
import Phaser from 'phaser';

export default class EnemyBase {
  constructor(scene, x, y, width = 32, height = 32, patrolRangeX = 100, maxHP = 1) {
    this.scene = scene;
    this.startX = x;
    this.patrolRangeX = patrolRangeX;

    this.maxHP = maxHP;
    this.hp = maxHP;
    this.isDead = false;

    this.sprite = scene.add.sprite(x, y, 'placeholder'); // 실제 Enemy 클래스에서 바꿀 것
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.direction = 1;
    this.speed = 50;

    // HP바
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 5, width, 5, 0x00ff00);
    this.hpBar.setOrigin(0.5, 0.5);
  }

  update() {
    if (!this.sprite || this.isDead) return;

    // Patrol
    if (this.sprite.x >= this.startX + this.patrolRangeX) this.direction = -1;
    if (this.sprite.x <= this.startX - this.patrolRangeX) this.direction = 1;
    this.sprite.body.setVelocityX(this.speed * this.direction);

    // HP바 위치 동기화
    this.hpBar.x = this.sprite.x;
    this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 5;
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;

    this.hp -= amount;

    if (this.hp <= 0) {
      this.isDead = true;

      // 죽는 순간 움직임 멈추기
      if (this.sprite.body) {
        this.sprite.body.setVelocity(0, 0);
      }
      this.direction = 0; // update에서 velocity가 다시 바뀌지 않도록

      // HP바 숨기기
      if (this.hpBar) this.hpBar.visible = false;

      this.playDeath();
    } else {
      this.playHit();
    }
  }

  playHit() {
    if (!this.sprite) return;
    if (this.sprite.anims) {
      this.sprite.play(`${this.type}_hit`);
      this.sprite.once(`animationcomplete-${this.type}_hit`, () => {
        if (!this.isDead) this.sprite.play(`${this.type}_idle`);
      });
    }
  }

  playDeath() {
    if (!this.sprite) return;
    if (this.sprite.anims) {
      this.sprite.play(`${this.type}_death`);
      this.sprite.once(`animationcomplete-${this.type}_death`, () => this.destroy());
    } else {
      this.destroy();
    }
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
    this.sprite = null;
    this.hpBar = null;
  }
}
