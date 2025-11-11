// characters/enemies/EnemyBase.js
import Phaser from 'phaser';
import { EnemiesData } from '../../config/enemiesData.js';

export default class EnemyBase {
  constructor(scene, x, y, enemyType) {
    this.scene = scene;
    this.enemyType = enemyType;

    // ✅ 데이터 가져오기
    this.data = EnemiesData[enemyType];
    if (!this.data) {
      console.error(`❌ Enemy data not found: ${enemyType}`);
      this.sprite = scene.add.sprite(x, y, '__MISSING');
      return;
    }

    // ✅ 스탯 설정 (랜덤 범위 적용)
    const stats = this.data.stats;
    this.maxHP = stats.maxHP;
    this.hp = this.maxHP;
    this.speed = Phaser.Math.Between(stats.speed.min, stats.speed.max);
    this.patrolRangeX = Phaser.Math.Between(stats.patrolRange.min, stats.patrolRange.max);
    this.expReward = stats.expReward;
    this.damageCooldown = stats.damageCooldown || 300;

    this.startX = x;
    this.isDead = false;
    this.lastDamageTime = 0;
    this.direction = 1;

    // ✅ 스프라이트 생성
    const spriteKey = `${enemyType}_idle`;

    // 텍스처 존재 확인
    if (!scene.textures.exists(spriteKey)) {
      console.error(`❌ Texture "${spriteKey}" not found. Did you preload it?`);
      this.sprite = scene.add.sprite(x, y, '__MISSING');
      return;
    }

    this.sprite = scene.add.sprite(x, y, spriteKey);
    this.sprite.setScale(this.data.sprite.scale);

    scene.physics.add.existing(this.sprite);

    const physics = this.data.physics;
    this.sprite.body.setSize(physics.width, physics.height);
    this.sprite.body.setCollideWorldBounds(physics.collideWorldBounds);
    this.sprite.body.setVelocityX(this.speed * this.direction);

    // ✅ HP바 생성
    const hpBarWidth = physics.width;
    this.hpBar = scene.add.rectangle(x, y - physics.height / 2 - 5, hpBarWidth, 5, 0x00ff00);
    this.hpBar.setOrigin(0.5, 0.5);
    this.hpBarMaxWidth = hpBarWidth;

    // ✅ 애니메이션 생성
    this.createAnimations();
    this.sprite.play(`${enemyType}_idle`);
  }

  /**
   * ✅ 애니메이션 생성 (데이터 기반)
   */
  createAnimations() {
    if (!this.data || !this.data.animations) {
      console.warn(`⚠️ No animation data for ${this.enemyType}`);
      return;
    }

    this.data.animations.forEach((animData) => {
      const key = `${this.enemyType}_${animData.key}`;

      if (!this.scene.anims.exists(key)) {
        // 텍스처 존재 확인
        if (!this.scene.textures.exists(key)) {
          console.error(`❌ Texture "${key}" not found for animation`);
          return;
        }

        this.scene.anims.create({
          key: key,
          frames: this.scene.anims.generateFrameNumbers(key, {
            start: animData.start,
            end: animData.end,
          }),
          frameRate: animData.frameRate,
          repeat: animData.repeat,
        });
      }
    });
  }

  /**
   * ✅ 정적 메서드: 에셋 로드
   */
  static preload(scene, enemyType) {
    const data = EnemiesData[enemyType];
    if (!data) {
      console.error(`❌ Enemy data not found: ${enemyType}`);
      return;
    }

    const { frameWidth, frameHeight } = data.sprite;
    const assets = data.assets;

    scene.load.spritesheet(`${enemyType}_idle`, assets.idle, { frameWidth, frameHeight });
    scene.load.spritesheet(`${enemyType}_hit`, assets.hit, { frameWidth, frameHeight });
    scene.load.spritesheet(`${enemyType}_death`, assets.death, { frameWidth, frameHeight });
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

    // 방향에 따라 flip
    this.sprite.setFlipX(this.direction > 0);
    if (this.sprite.flipX) {
      this.sprite.setFlipX(this.direction < 0);
    }

    // HP바 위치 동기화
    this.hpBar.x = this.sprite.x;
    this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 5;
  }

  /**
   * ✅ 데미지 받기 (경험치 반환 포함)
   */
  takeDamage(amount = 1) {
    if (this.isDead) return false;

    // 쿨다운 체크
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDamageTime < this.damageCooldown) {
      return false;
    }
    this.lastDamageTime = currentTime;

    this.hp -= amount;

    // HP바 업데이트
    const hpPercent = Math.max(0, this.hp / this.maxHP);
    this.hpBar.width = this.hpBarMaxWidth * hpPercent;

    // HP바 색상 변경
    if (hpPercent > 0.6) {
      this.hpBar.setFillStyle(0x00ff00); // 초록
    } else if (hpPercent > 0.3) {
      this.hpBar.setFillStyle(0xffff00); // 노랑
    } else {
      this.hpBar.setFillStyle(0xff0000); // 빨강
    }

    if (this.hp <= 0) {
      this.isDead = true;
      // 움직임 멈추기
      if (this.sprite.body) {
        this.sprite.body.setVelocity(0, 0);
      }
      this.direction = 0;

      // HP바 숨기기
      if (this.hpBar) this.hpBar.visible = false;

      this.playDeath();
      return true; // ✅ 죽음 반환
    } else {
      this.playHit();
      return false; // ✅ 살아있음 반환
    }
  }

  playHit() {
    if (!this.sprite) return;
    const hitKey = `${this.enemyType}_hit`;
    const idleKey = `${this.enemyType}_idle`;

    this.sprite.play(hitKey);
    this.sprite.once(`animationcomplete-${hitKey}`, () => {
      if (!this.isDead && this.sprite) {
        this.sprite.play(idleKey);
      }
    });
  }

  playDeath() {
    if (!this.sprite) return;
    const deathKey = `${this.enemyType}_death`;

    this.sprite.play(deathKey);
    this.sprite.once(`animationcomplete-${deathKey}`, () => {
      this.destroy();
    });
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
    this.sprite = null;
    this.hpBar = null;
  }
}
