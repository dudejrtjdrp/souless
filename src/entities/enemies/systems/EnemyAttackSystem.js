export default class EnemyAttackSystem {
  constructor(enemy, scene, config) {
    this.enemy = enemy;
    this.scene = scene;

    this.range = config.range;
    this.damage = config.damage;
    this.cooldown = config.cooldown;
    this.hitDelay = config.hitDelay || 200;
    this.animationKey = config.animationKey || 'attack';

    this._isExecuting = false;
  }

  attack(player, onComplete) {
    // ✅ 콜백 파라미터 추가
    if (this._isExecuting) {
      return;
    }

    if (!player || player.isDead) {
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

    // 전체 공격 시퀀스 종료
    const totalAttackTime = this.hitDelay + 300;
    this.scene.time.delayedCall(totalAttackTime, () => {
      this._isExecuting = false;

      // idle 애니메이션 복귀
      if (!this.enemy.isDead && this.enemy.sprite) {
        this.enemy.sprite.play(`${this.enemy.enemyType}_idle`);
      }

      // ✅ 콜백 호출
      if (onComplete) {
        onComplete();
      }
    });
  }

  applyDamage(player) {
    if (!player || player.isDead) {
      console.warn(`⚠️ Player invalid during damage application`);
      return;
    }

    const healthBefore = player.health;
    player.takeDamage(this.damage);
    const healthAfter = player.health;

    const actualDamage = healthBefore - healthAfter;

    // UI 업데이트
    if (this.scene.events) {
      this.scene.events.emit('player-stats-updated', player);
    }
  }
}
