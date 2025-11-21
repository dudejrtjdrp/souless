export default class CombatCollisionHandler {
  constructor(scene) {
    this.scene = scene;
  }

  async checkAttackCollisions() {
    if (!this.canCheckCollisions()) {
      return;
    }

    // 플레이어 → 적 공격 체크
    for (const enemy of this.scene.enemyManager.enemies) {
      this.checkPlayerAttackOnEnemy(enemy);
    }

    if (this.scene.currentBoss && !this.scene.currentBoss.isDead) {
      this.checkPlayerAttackOnEnemy(this.scene.currentBoss);
    }

    // 적 → 플레이어 공격 체크
    this.checkEnemyAttacksOnPlayer();
  }

  canCheckCollisions() {
    return this.scene.enemyManager?.enemies && this.scene.player;
  }

  // ✅ 단순화: 데미지만 처리, 경험치는 EnemyBase에서
  checkPlayerAttackOnEnemy(enemy) {
    const enemyTarget = enemy.sprite || enemy;

    // 기본 공격 체크
    if (this.scene.player.isAttacking?.()) {
      const hit = this.scene.player.checkAttackHit(enemyTarget);
      if (hit && enemy.takeDamage) {
        enemy.takeDamage(10);
        // ✅ 경험치는 takeDamage → playDeath → destroy에서 자동 처리
      }
    }

    // 스킬 공격 체크
    if (this.scene.player.isUsingSkill?.()) {
      const skillHit = this.scene.player.checkSkillHit(enemy);
      if (skillHit?.hit && enemy.takeDamage) {
        enemy.takeDamage(skillHit.damage);
        // ✅ 경험치는 자동 처리

        // 넉백 처리
        if (skillHit.knockback && enemyTarget.body) {
          this.applyEnemyKnockback(enemyTarget, skillHit.knockback);
        }
      }
    }
  }

  // 적이 플레이어를 공격
  checkEnemyAttacksOnPlayer() {
    if (!this.scene.player) return;

    // 일반 적들의 스킬 체크
    this.scene.enemyManager.enemies.forEach((enemy) => {
      if (enemy.skillSystem) {
        const hit = enemy.skillSystem.checkSkillHit(this.scene.player);
        if (hit) {
          this.handlePlayerDamage(hit, enemy);
        }
      }
    });

    // 보스 스킬 체크
    if (this.scene.currentBoss && this.scene.currentBoss.skillSystem) {
      const hit = this.scene.currentBoss.skillSystem.checkSkillHit(this.scene.player);
      if (hit) {
        this.handlePlayerDamage(hit, this.scene.currentBoss);
      }
    }
  }

  // 플레이어 데미지 처리
  handlePlayerDamage(hit, enemy) {
    if (!this.scene.player.takeDamage) return;

    this.scene.player.takeDamage(hit.damage);

    // 넉백 처리
    if (hit.knockback && this.scene.player.sprite?.body) {
      this.applyPlayerKnockback(hit.knockback, enemy);
    }
  }

  // 플레이어 넉백
  applyPlayerKnockback(knockback, enemy) {
    if (!this.scene.player.sprite?.body) return;

    const { x = 0, y = 0 } = knockback;
    const knockbackDir = enemy.direction;

    this.scene.player.isKnockedBack = true;

    this.scene.player.sprite.body.setVelocity(knockbackDir * x, -Math.abs(y));

    this.scene.time.delayedCall(200, () => {
      if (this.scene.player) {
        this.scene.player.isKnockedBack = false;
      }
    });
  }

  // 적 넉백
  applyEnemyKnockback(target, knockback) {
    const facingRight = !this.scene.player.sprite.flipX;
    const xVelocity = facingRight ? knockback.x : -knockback.x;

    target.body.setVelocityX(xVelocity);
    target.body.setVelocityY(knockback.y);
  }
}
