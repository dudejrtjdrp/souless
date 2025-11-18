import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillCooldown = config.skillCooldown || 3000;
    this.lastSkillTime = 0;
    this.skills = config.skills || [];

    // ✅ 추가: 이동 관련 설정
    this.walkSpeed = enemy.speed; // 기본 속도 (걷기)
    this.runSpeed = enemy.data.stats.runSpeed || enemy.speed * 2;
    this.walkRange = config.walkRange || 200; // 걷기 범위
    this.runRange = config.runRange || 200; // 달리기 범위

    this.currentMoveState = 'walk'; // 현재 이동 상태
  }

  update(time, delta) {
    // 타겟 찾기
    this.findTarget();

    if (!this.target) {
      // ✅ 타겟 없으면 idle
      if (this.currentMoveState !== 'idle') {
        this.setMoveState('idle');
      }
      // ✅ 속도도 0으로
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);
      }
      return;
    }

    // 타겟과의 거리 계산
    const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
    const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
    const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    const realDist = dist - sizeOffset;

    // 공격 범위 내
    if (realDist <= this.attackRange) {
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);
      }

      // ✅ 공격 중이 아니면 idle
      if (this.currentMoveState !== 'idle' && !this.isInAttackState) {
        this.setMoveState('idle');
      }

      this.tryAttack(time);
    }
    // 달리기 범위 (가까움)
    else if (realDist <= this.runRange) {
      if (!this.isInAttackState) {
        this.setMoveState('run');
        this.moveTowardTarget(targetX, targetY, this.runSpeed);
      }
    }
    // 걷기 범위 (보통)
    else if (dist <= this.detectRange) {
      if (!this.isInAttackState) {
        this.setMoveState('walk');
        this.moveTowardTarget(targetX, targetY, this.walkSpeed);
      }
    }
    // 범위 밖
    else {
      if (this.currentMoveState !== 'idle') {
        this.setMoveState('idle');
      }
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);
      }
      this.target = null;
    }

    // 스킬 사용
    const timeSinceLastSkill = time - this.lastSkillTime;
    if (this.target && timeSinceLastSkill >= this.skillCooldown) {
      this.castRandomSkill(time);
    }
  }

  /**
   * ✅ 새 메서드: 이동 상태 변경 및 애니메이션 재생
   */
  setMoveState(state) {
    if (this.currentMoveState === state) return;

    this.currentMoveState = state;
    const animKey = `${this.enemy.enemyType}_${state}`;

    if (this.enemy.scene.anims.exists(animKey)) {
      this.enemy.sprite.play(animKey, true);
    }
  }

  /**
   * ✅ 새 메서드: 타겟을 향해 이동 (속도 지정 가능)
   */
  moveTowardTarget(targetX, targetY, speed) {
    if (this.enemy.isDead || !this.enemy.sprite.body) return;

    const angle = Phaser.Math.Angle.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      targetX,
      targetY,
    );

    this.enemy.sprite.body.setVelocityX(Math.cos(angle) * speed);

    // ✅ 방향 설정 (중요!)
    this.enemy.direction = Math.cos(angle) > 0 ? 1 : -1;
  }

  castRandomSkill(time) {
    if (!this.skills || this.skills.length === 0) {
      console.warn('⚠️ No skills available for', this.enemy.enemyType);
      return;
    }

    const skillName = Phaser.Utils.Array.GetRandom(this.skills);
    this.enemy.castSkill(skillName);
    this.lastSkillTime = time;
  }
}
