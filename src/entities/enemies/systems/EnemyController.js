export default class EnemyController {
  constructor(enemy, config = {}) {
    this.enemy = enemy;

    this.attackRange = config.attackRange || 70;
    this.detectRange = config.detectRange || 200;
    this.attackCooldown = config.attackCooldown || 1500;

    this.lastAttackTime = 0; // ⚠️ 변수명 명확하게
    this.target = null;
    this.isInAttackState = false; // 공격 중 플래그
  }

  update(time, delta) {
    // 피격 중에는 아무 행동도 하지 않음
    if (this.enemy.isBeingHit) {
      return;
    }

    // 1. 매 프레임 타겟을 찾거나 갱신
    this.findTarget();

    if (this.target) {
      // 2. 타겟이 있는 경우: 추적 및 공격
      const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
      const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
      const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
      const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

      const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
      const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
      const realDist = dist - sizeOffset;

      // 공격 범위 내인 경우
      if (realDist <= this.attackRange) {
        // 공격 시 완전히 멈춤
        if (this.enemy.sprite.body) {
          this.enemy.sprite.body.setVelocityX(0);
          this.enemy.sprite.body.setVelocityY(0);
        }

        // 쿨다운 체크 후 공격
        this.tryAttack(time);
        return;
      }

      // 추적 범위 내인 경우 (공격 중이 아닐 때만 추적)
      if (dist <= this.detectRange && !this.isInAttackState) {
        this.enemy.moveToward({ x: targetX, y: targetY });
        return;
      }
    }

    // 3. 타겟이 없는 경우: 패트롤 (공격 중이 아닐 때만)
    if (!this.isInAttackState) {
      this.patrol();
    }
  }

  findTarget() {
    const player = this.enemy.scene.player;

    if (!player || !player.sprite) {
      this.target = null;
      return;
    }

    const playerX = player.sprite.x;
    const playerY = player.sprite.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, playerX, playerY);

    // 감지 범위 내에 있으면 항상 타겟으로 설정 (넉백 후에도 추적 재개)
    if (dist <= this.detectRange) {
      this.target = player;
    } else {
      this.target = null;
    }
  }

  patrol() {
    const enemy = this.enemy;
    if (!enemy.sprite.body) return;

    const leftBound = enemy.startX - enemy.patrolRangeX;
    const rightBound = enemy.startX + enemy.patrolRangeX;

    const currentVelocityX = enemy.sprite.body.velocity.x;
    if (Math.abs(currentVelocityX) > 0) {
      if (Math.abs(currentVelocityX) <= enemy.speed * 1.1) {
        enemy.direction = currentVelocityX > 0 ? 1 : -1;
      }
    }

    if (enemy.sprite.x <= leftBound) {
      enemy.direction = 1;
      enemy.sprite.x = leftBound + 1;
    } else if (enemy.sprite.x >= rightBound) {
      enemy.direction = -1;
      enemy.sprite.x = rightBound - 1;
    }

    enemy.sprite.body.setVelocityX(enemy.speed * enemy.direction);
  }

  tryAttack(time) {
    // 피격 중이면 공격 불가
    if (this.enemy.isBeingHit) {
      return;
    }

    const timeSinceLastAttack = time - this.lastAttackTime;
    if (timeSinceLastAttack < this.attackCooldown) {
      return;
    }

    if (this.isInAttackState) {
      return;
    }

    if (!this.enemy.attackSystem) {
      return;
    }

    if (!this.target || !this.target.sprite) {
      return;
    }

    const targetX = this.target.sprite.x;
    const targetY = this.target.sprite.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
    const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    const realDist = dist - sizeOffset;

    if (realDist > this.attackRange * 1.2) {
      return;
    }

    this.lastAttackTime = time;
    this.isInAttackState = true;

    // 공격 실행하고 완료 시 콜백으로 상태 해제
    this.enemy.attackSystem.attack(this.target, () => {
      this.isInAttackState = false;
    });
  }
}
