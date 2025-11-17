export default class EnemyController {
  constructor(enemy, config = {}) {
    this.enemy = enemy;

    this.attackRange = config.attackRange || 70;
    this.detectRange = config.detectRange || 200;

    this.target = null;
  }

  update(time, delta) {
    this.findTarget();

    if (this.target) {
      const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
      const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
      const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, targetX, targetY);

      // ✅ AttackSystem의 실제 range 사용
      const effectiveAttackRange = this.enemy.attackSystem
        ? this.enemy.attackSystem.range
        : this.attackRange;

      // ✅ 공격 범위를 더 좁게: range * 0.9 (안전 마진)
      // 이렇게 하면 AttackSystem의 범위 안에 확실히 들어감
      if (dist <= effectiveAttackRange * 0.9) {
        // 공격 시 완전히 멈춤
        if (this.enemy.sprite.body) {
          this.enemy.sprite.body.setVelocityX(0);
          this.enemy.sprite.body.setVelocityY(0);
        }
        this.tryAttack();
        return;
      }

      // ✅ 감지 범위 내: 추적 (공격 범위보다 넓게)
      if (dist <= this.detectRange) {
        this.enemy.moveToward({ x: targetX, y: targetY });
        return;
      }
    }

    // 타겟이 없는 경우: 패트롤
    this.patrol();
  }

  findTarget() {
    const player = this.enemy.scene.player;

    if (!player || player.isDead || !player.sprite) {
      this.target = null;
      return;
    } // 플레이어 위치 안전하게 가져오기

    const playerX = player.sprite.x;
    const playerY = player.sprite.y;

    const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerX, playerY); // 감지 범위 내에 있으면 타겟 설정

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
    const rightBound = enemy.startX + enemy.patrolRangeX; // 1. 현재 속도를 기준으로 방향을 판단하여 유지 (추적 후 복귀 시 자연스러움)

    const currentVelocityX = enemy.sprite.body.velocity.x;
    if (Math.abs(currentVelocityX) > 0) {
      if (Math.abs(currentVelocityX) <= enemy.speed * 1.1) {
        enemy.direction = currentVelocityX > 0 ? 1 : -1;
      }
    } // 2. 경계에 닿으면 방향 전환

    if (enemy.sprite.x <= leftBound) {
      enemy.direction = 1; // 오른쪽으로
      enemy.sprite.x = leftBound + 1; // 겹침 방지
    } else if (enemy.sprite.x >= rightBound) {
      enemy.direction = -1; // 왼쪽으로
      enemy.sprite.x = rightBound - 1; // 겹침 방지
    } // 3. 설정된 방향으로 속도 적용

    enemy.sprite.body.setVelocityX(enemy.speed * enemy.direction);
  }

  tryAttack() {
    // AttackSystem 확인
    if (!this.enemy.attackSystem) {
      console.warn(`⚠️ ${this.enemy.enemyType}: attackSystem not found`);
      return;
    }

    // Target 확인
    if (!this.target || this.target.isDead) {
      return;
    }

    // AttackSystem의 canAttack()이 내부적으로 범위와 쿨다운을 모두 체크
    if (this.enemy.attackSystem.canAttack(this.target)) {
      this.enemy.attackSystem.attack(this.target);
    }
  }
}
