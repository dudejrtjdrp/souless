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
    // 1. 매 프레임 타겟을 찾거나 갱신
    this.findTarget();

    if (this.target) {
      // 2. 타겟이 있는 경우: 추적 및 공격
      const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
      const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;

      const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, targetX, targetY);

      // 공격 범위 내인 경우
      if (dist <= this.attackRange) {
        // 공격 시 완전히 멈춤
        if (this.enemy.sprite.body) {
          this.enemy.sprite.body.setVelocityX(0);
          this.enemy.sprite.body.setVelocityY(0);
        }

        // ⚠️ 쿨다운 체크 후 공격
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

    const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerX, playerY);

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
    // 🔍 쿨다운 체크 (가장 먼저!)
    const timeSinceLastAttack = time - this.lastAttackTime;
    if (timeSinceLastAttack < this.attackCooldown) {
      // 쿨다운 중일 때는 로그 줄이기 (1초마다만)
      return;
    }

    // 🔍 이미 공격 중이면 스킵
    if (this.isInAttackState) {
      return;
    }

    // 🔍 attackSystem 존재 확인
    if (!this.enemy.attackSystem) {
      console.warn('⚠️ attackSystem not found on enemy:', this.enemy.enemyType);
      return;
    }

    // 🔍 target 유효성 확인
    if (!this.target || !this.target.sprite) {
      console.warn('⚠️ Invalid target');
      return;
    }

    // 🔍 거리 재확인
    const targetX = this.target.sprite.x;
    const targetY = this.target.sprite.y;
    const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, targetX, targetY);

    if (dist > this.attackRange * 1.2) {
      return;
    }

    // ⚠️ 쿨다운 시간 기록 (먼저!)
    this.lastAttackTime = time;
    this.isInAttackState = true;

    // 🎯 실제 공격 실행
    this.enemy.attackSystem.attack(this.target);

    // ⚠️ 공격 애니메이션 시간 + 약간의 여유 후 공격 상태 해제
    const attackDuration = this.attackCooldown * 0.3; // 쿨다운의 30% 정도
    this.enemy.scene.time.delayedCall(attackDuration, () => {
      this.isInAttackState = false;
    });
  }
}
