export default class EnemyAttackSystem {
  constructor(enemy, scene, config) {
    this.enemy = enemy;
    this.scene = scene;

    this.range = config.range;
    this.damage = config.damage;
    this.cooldown = config.cooldown; // 참고용 (실제 쿨다운은 Controller에서 관리)
    this.hitDelay = config.hitDelay || 200;
    this.animationKey = config.animationKey || 'attack';

    this._isExecuting = false; // 공격 실행 중 플래그
  }

  attack(player) {
    // 이미 공격 실행 중이면 스킵
    if (this._isExecuting) {
      return;
    }

    if (!player || player.isDead) {
      console.warn(`⚠️ ${this.enemy.enemyType}: Invalid or dead player`);
      return;
    }

    this._isExecuting = true;

    // 애니메이션 재생
    if (this.scene.anims.exists(this.animationKey)) {
      this.enemy.sprite.play(this.animationKey, true);
    }

    // hitDelay 후 데미지 적용
    this.scene.time.delayedCall(this.hitDelay, () => {
      this.applyDamage(player);
    });

    // 전체 공격 시퀀스 종료 (애니메이션 시간 고려)
    const totalAttackTime = this.hitDelay + 100; // hitDelay + 약간의 여유
    this.scene.time.delayedCall(totalAttackTime, () => {
      this._isExecuting = false;

      // idle 애니메이션 복귀
      if (!this.enemy.isDead && this.enemy.sprite) {
        this.enemy.sprite.play(`${this.enemy.enemyType}_idle`);
      }
    });
  }

  applyDamage(player) {
    if (!player || player.isDead) {
      console.warn(`⚠️ Player invalid during damage application`);
      return;
    }

    // 거리 재확인
    const playerX = player.sprite ? player.sprite.x : player.x;
    const playerY = player.sprite ? player.sprite.y : player.y;

    const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerX, playerY);

    if (distance > this.range * 1.5) {
      return;
    }

    // 데미지 적용
    if (typeof player.takeDamage === 'function') {
      const healthBefore = player.health;
      player.takeDamage(this.damage);
      const healthAfter = player.health;

      const actualDamage = healthBefore - healthAfter;

      // UI 업데이트
      if (this.scene.events) {
        this.scene.events.emit('player-stats-updated', player);
      }
    } else {
      console.error(`❌ Player has no takeDamage method!`);
    }
  }
}
