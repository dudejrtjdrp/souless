export default class CombatCollisionHandler {
  constructor(scene) {
    this.scene = scene;
  }

  checkAttackCollisions() {
    if (!this.canCheckCollisions()) {
      return;
    }

    this.scene.enemyManager.enemies.forEach((enemy) => {
      this.checkEnemyCollision(enemy);
    });
  }

  canCheckCollisions() {
    return this.scene.enemyManager?.enemies && this.scene.player;
  }

  checkEnemyCollision(enemy) {
    const enemyTarget = enemy.sprite || enemy;

    this.checkBasicAttack(enemy, enemyTarget);
    this.checkSkillAttack(enemy, enemyTarget);
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
      this.applyKnockback(enemyTarget, skillHit.knockback);
    }
  }

  grantExperience(amount) {
    this.scene.player.gainExp(amount);
    this.scene.onExpGained(amount, this.scene.selectedCharacter);
  }

  applyKnockback(target, knockback) {
    const facingRight = !this.scene.player.sprite.flipX;
    const xVelocity = facingRight ? knockback.x : -knockback.x;

    target.body.setVelocityX(xVelocity);
    target.body.setVelocityY(knockback.y);
  }
}
