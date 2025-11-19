export default class CombatCollisionHandler {
  constructor(scene) {
    this.scene = scene;
  }

  checkAttackCollisions() {
    if (!this.canCheckCollisions()) {
      return;
    }

    // 플레이어 → 적 공격 체크
    this.scene.enemyManager.enemies.forEach((enemy) => {
      this.checkPlayerAttackOnEnemy(enemy);
    });

    if (this.scene.currentBoss && !this.scene.currentBoss.isDead) {
      this.checkPlayerAttackOnEnemy(this.scene.currentBoss);
    }

    // 적 → 플레이어 공격 체크
    this.checkEnemyAttacksOnPlayer();
  }

  canCheckCollisions() {
    return this.scene.enemyManager?.enemies && this.scene.player;
  }

  // 플레이어가 적을 공격
  checkPlayerAttackOnEnemy(enemy) {
    const enemyTarget = enemy.sprite || enemy;

    this.checkBasicAttack(enemy, enemyTarget);
    this.checkSkillAttack(enemy, enemyTarget);
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

  // 플레이어 데미지 처리 (수정)
  handlePlayerDamage(hit, enemy) {
    if (!this.scene.player.takeDamage) {
      return;
    }

    // 플레이어 takeDamage가 객체를 받을 수 있는지 확인
    if (typeof this.scene.player.takeDamage === 'function') {
      this.scene.player.takeDamage(hit.damage);
    }

    // 넉백 직접 적용 (플레이어가 넉백을 처리하지 않을 경우)
    if (hit.knockback && this.scene.player.sprite?.body) {
      this.applyPlayerKnockback(hit.knockback, enemy);
    }
  }

  // 플레이어 넉백 적용
  applyPlayerKnockback(knockback, enemy) {
    if (!this.scene.player.sprite?.body) return;

    const { x = 0, y = 0 } = knockback;

    // 적의 방향을 고려한 넉백
    const knockbackDir = enemy.direction; // 적 방향의 반대로 플레이어가 밀림

    // 플레이어를 넉백 상태로 설정 (입력 차단)
    this.scene.player.isKnockedBack = true;

    this.scene.player.sprite.body.setVelocity(
      knockbackDir * x,
      -Math.abs(y), // Y는 항상 위로
    );

    // 넉백 지속 시간 후 상태 해제
    const knockbackDuration = 200; // 넉백 지속 시간

    this.scene.time.delayedCall(knockbackDuration, () => {
      if (this.scene.player) {
        this.scene.player.isKnockedBack = false;
      }
    });
  }

  checkBasicAttack(enemy, enemyTarget) {
    if (!this.scene.player.isAttacking?.()) {
      return;
    }

    const hit = this.scene.player.checkAttackHit(enemyTarget);

    if (hit && enemy.takeDamage) {
      this.handleEnemyDamage(enemy, 10);
    }
  }

  checkSkillAttack(enemy, enemyTarget) {
    if (!this.scene.player.isUsingSkill?.()) {
      return;
    }

    const skillHit = this.scene.player.checkSkillHit(enemy);

    if (skillHit?.hit && enemy.takeDamage) {
      this.handleSkillDamage(enemy, enemyTarget, skillHit);
    }
  }

  handleEnemyDamage(enemy, damage) {
    const died = enemy.takeDamage(damage);

    if (died && enemy.expReward) {
      this.grantExperience(enemy.expReward);
    }
  }

  handleSkillDamage(enemy, enemyTarget, skillHit) {
    const died = enemy.takeDamage(skillHit.damage);

    if (died && enemy.expReward) {
      this.grantExperience(enemy.expReward);
    }

    if (skillHit.knockback && enemyTarget.body) {
      this.applyEnemyKnockback(enemyTarget, skillHit.knockback);
    }
  }

  grantExperience(amount) {
    this.scene.player.gainExp(amount);
    this.scene.onExpGained(amount, this.scene.selectedCharacter);
  }

  // 적 넉백 적용 (기존 메서드명 변경)
  applyEnemyKnockback(target, knockback) {
    const facingRight = !this.scene.player.sprite.flipX;
    const xVelocity = facingRight ? knockback.x : -knockback.x;

    target.body.setVelocityX(xVelocity);
    target.body.setVelocityY(knockback.y);
  }
}
