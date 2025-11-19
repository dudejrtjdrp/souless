import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillNames = config.skills || [];

    // 감지 범위 설정 (가장 중요!)
    this.detectRange = config.detectRange || 500; // ⭐ 플레이어를 감지하는 거리

    // 이동 설정
    this.walkSpeed = enemy.speed;
    this.runSpeed = enemy.data.stats.runSpeed || enemy.speed * 2;
    this.walkRange = config.walkRange || 300;
    this.runRange = config.runRange || 200;

    // 공격 범위 설정 (캐릭터에 붙을 거리)
    this.attackRange = config.attackRange || 80; // ⭐ 이 값을 조절하세요!

    this.currentMoveState = 'idle';
  }

  update(time, delta) {
    // 피격 중에는 아무 행동도 하지 않음
    if (this.enemy.isBeingHit) {
      return;
    }

    // 매 프레임 타겟 갱신 (넉백 후에도 추적 재개)
    this.findTarget();

    if (!this.target) {
      if (this.currentMoveState !== 'idle') {
        this.setMoveState('idle');
      }
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);
      }
      return;
    }

    const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
    const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

    // 거리 계산 통일
    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
    const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    const realDist = dist - sizeOffset;

    // 스킬 사용 중이면 이동 제한
    if (this.isUsingSkill()) {
      return;
    }

    this.tryAttackOrSkill(time);
    // 공격 범위 내 (캐릭터에 붙음)
    if (dist <= this.attackRange) {
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);

        if (!this.isInAttackState && !this.isUsingSkill()) {
          this.setMoveState('idle');
        }
      }
    }
    // 달리기 범위
    // 달리기 범위
    else if (dist <= this.runRange) {
      if (!this.isInAttackState && !this.isUsingSkill()) {
        this.setMoveState('run');
        this.moveTowardTarget(targetX, targetY, this.runSpeed);
      }
    }
    // 걷기 범위
    else if (dist <= this.detectRange) {
      if (!this.isInAttackState && !this.isUsingSkill()) {
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
  }

  setMoveState(state) {
    this.currentMoveState = state;
    const animKey = `${this.enemy.enemyType}_${state}`;
    if (this.enemy.scene.anims.exists(animKey)) {
      this.enemy.sprite.play(animKey, true);
    }
  }

  moveTowardTarget(targetX, targetY, speed) {
    if (this.enemy.isDead || !this.enemy.sprite.body) return;

    const angle = Phaser.Math.Angle.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      targetX,
      targetY,
    );

    this.enemy.sprite.body.setVelocityX(Math.cos(angle) * speed);

    // 스킬 사용 중이 아닐 때만 방향 전환
    if (!this.enemy.isLockingDirection) {
      this.enemy.direction = Math.cos(angle) > 0 ? 1 : -1;
    }
  }

  /**
   * 공격 또는 스킬 사용 시도
   */
  tryAttackOrSkill(time) {
    // 피격 중이면 공격/스킬 불가
    if (this.enemy.isBeingHit) {
      return;
    }

    if (this.isInAttackState) {
      return;
    }

    if (!this.enemy.skillSystem) {
      console.warn('⚠️ No skill system for', this.enemy.enemyType);
      return;
    }

    // 사용 가능한 스킬 가져오기 (각 스킬의 cooldown 체크됨)
    const usableSkills = this.enemy.skillSystem.getUsableSkills(this.target);

    if (usableSkills.length === 0) {
      return; // 로그 제거
    }

    // skillNames 필터링 (설정된 경우)
    let availableSkills = usableSkills;
    if (this.skillNames.length > 0) {
      availableSkills = usableSkills.filter((skill) => {
        const skillName = skill.name || skill.config?.name;
        return this.skillNames.includes(skillName);
      });
    }

    if (availableSkills.length === 0) {
      return; // 로그 제거
    }

    // 현재 거리 계산 (realDist 사용)
    const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
    const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;
    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
    const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    const currentDistance = dist - sizeOffset;

    availableSkills = availableSkills.filter((skill) => {
      const config = skill.config;

      // 스킬에 range가 설정되어 있으면 체크
      if (config.range !== undefined) {
        if (currentDistance > config.range) {
          return false;
        }
      }

      // movement 스킬은 너무 가까우면 제외
      if (config.type === 'movement') {
        const minDistance = (config.range || 200) * 0.7;
        if (currentDistance < minDistance) {
          return false;
        }
      }

      return true;
    });

    if (availableSkills.length === 0) {
      return;
    }

    // 우선순위 정렬 (높은 우선순위 먼저)
    availableSkills.sort((a, b) => {
      const priorityA = a.config?.priority || 0;
      const priorityB = b.config?.priority || 0;
      return priorityB - priorityA;
    });

    this.isInAttackState = true;

    // 가장 높은 우선순위 스킬 사용
    const selectedSkill = availableSkills[0];
    const skillName = selectedSkill.name || selectedSkill.config?.name;
    this.enemy.skillSystem.useSkill(skillName, this.target);
  }

  /**
   * 스킬 사용 중 확인
   */
  isUsingSkill() {
    if (!this.enemy.skillSystem) return false;

    for (const skill of this.enemy.skillSystem.skills.values()) {
      if (skill.isActive) return true;
    }
    return false;
  }
}
