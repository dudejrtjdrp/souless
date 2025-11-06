import Phaser from 'phaser';

export default class EnemyBase {
  constructor(scene, x, y, width = 32, height = 32, patrolRangeX = 100, speed = 50, maxHP = 3) {
    this.scene = scene;
    this.patrolRangeX = patrolRangeX;
    this.speed = speed;

    this.startX = x;
    this.maxHP = maxHP;
    this.hp = maxHP;
    this.isDead = false;

    // 데미지 쿨다운 (연속 히트 방지)
    this.lastDamageTime = 0;
    this.damageCooldown = 300; // 300ms 쿨다운

    this.sprite = scene.add.sprite(x, y, 'placeholder');
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);

    this.direction = 1;

    // HP바
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 5, width, 5, 0x00ff00);
    this.hpBar.setOrigin(0.5, 0.5);
    this.hpBarMaxWidth = width;

    this.sprite.body.setVelocityX(this.speed * this.direction);

    this.type = 'enemy';
  }

  update() {
    if (!this.sprite || this.isDead) return;

    // Patrol
    if (this.sprite.x >= this.startX + this.patrolRangeX) {
      this.direction = -1;
      this.sprite.body.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.x <= this.startX - this.patrolRangeX) {
      this.direction = 1;
      this.sprite.body.setVelocityX(this.speed * this.direction);
    }

    if (this.direction > 0) {
      this.sprite.setFlipX(true);
    } else {
      this.sprite.setFlipX(false);
    }

    // HP바 위치 동기화
    this.hpBar.x = this.sprite.x;
    this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 5;
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;

    // 쿨다운 체크 (너무 빠르게 연속으로 맞지 않도록)
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDamageTime < this.damageCooldown) {
      return; // 쿨다운 중이면 무시
    }
    this.lastDamageTime = currentTime;

    this.hp -= amount;

    // HP바 업데이트
    const hpPercent = Math.max(0, this.hp / this.maxHP);
    this.hpBar.width = this.hpBarMaxWidth * hpPercent;

    // HP바 색상 변경 (초록 -> 노랑 -> 빨강)
    if (hpPercent > 0.6) {
      this.hpBar.setFillStyle(0x00ff00); // 초록
    } else if (hpPercent > 0.3) {
      this.hpBar.setFillStyle(0xffff00); // 노랑
    } else {
      this.hpBar.setFillStyle(0xff0000); // 빨강
    }

    if (this.hp <= 0) {
      this.isDead = true;
      console.log(`[Enemy] 💀 Died!`);

      // 죽는 순간 움직임 멈추기
      if (this.sprite.body) {
        this.sprite.body.setVelocity(0, 0);
      }
      this.direction = 0;

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
