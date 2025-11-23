import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillNames = config.skills || [];

    // 감지 범위 설정
    this.detectRange = config.detectRange || 500;

    // 이동 설정
    this.walkSpeed = enemy.speed;
    this.runSpeed = enemy.data.stats.runSpeed || enemy.speed * 2;
    this.walkRange = config.walkRange || 300;
    this.runRange = config.runRange || 200;

    // 공격 범위 설정
    this.attackRange = config.attackRange || 80;

    this.currentMoveState = 'idle';

    // 새로 추가: 페이즈 시스템
    this.currentPhase = 1;
    this.maxPhase = config.maxPhase || 1;
    this.phaseTransitionTriggered = false;
    this.phaseThresholds = config.phaseThresholds || [0.5];
  }

  update(time, delta) {
    // 기본 유효성 체크
    if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) {
      return;
    }

    // 피격 중에는 아무 행동도 하지 않음
    if (this.enemy.isBeingHit) {
      return;
    }

    // 고정 보스 (final_boss)는 이동 없이 스킬만 사용
    if (this.enemy.isStationary) {
      // 속도 강제로 0 유지
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocity(0, 0);
      }

      // 페이즈 전환 체크
      this.checkPhaseTransition();

      // 타겟 찾기
      this.findTarget();

      // 스킬 사용
      if (this.target && this.target.sprite && this.target.sprite.active) {
        this.tryAttackOrSkill(time);
      }

      return; // 이동 로직 건너뛰기
    }

    // 일반 보스는 기존 로직
    this.checkPhaseTransition();
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

    if (!this.target.sprite || !this.target.sprite.active) {
      this.target = null;
      return;
    }

    const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
    const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;

    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);

    let sizeOffset = 0;
    if (this.enemy.sprite.body && this.target.sprite.body) {
      sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    } else {
      sizeOffset = 50;
    }

    const realDist = dist - sizeOffset;

    if (this.isUsingSkill()) {
      return;
    }

    this.tryAttackOrSkill(time);

    // 공격 범위 내
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

  // 새로 추가: 페이즈 전환 체크
  checkPhaseTransition() {
    if (this.phaseTransitionTriggered) return;
    if (this.currentPhase >= this.maxPhase) return;
    if (!this.enemy || !this.enemy.maxHP) return;

    const hpRatio = this.enemy.hp / this.enemy.maxHP;
    const threshold = this.phaseThresholds[this.currentPhase - 1];

    if (hpRatio <= threshold) {
      this.phaseTransitionTriggered = true;
      this.triggerPhaseTransition();
    }
  }

  // 새로 추가: 페이즈 전환 실행
  async triggerPhaseTransition() {
    const nextPhase = this.currentPhase + 1;
    // 보스 무적 처리
    this.enemy.isInvincible = true;

    // 이동 정지
    if (this.enemy.sprite.body) {
      this.enemy.sprite.body.setVelocityX(0);
      this.enemy.sprite.body.setVelocityY(0);
    }

    // 씬의 페이즈 전환 연출 실행
    await this.enemy.scene.playBossPhaseTransition(this.enemy, this.currentPhase, nextPhase);

    // 페이즈 업데이트
    this.currentPhase = nextPhase;
    this.phaseTransitionTriggered = false;

    // 페이즈별 변경사항 적용
    this.applyPhaseChanges(nextPhase);

    // 무적 해제
    this.enemy.isInvincible = false;
  }

  // 새로 추가: 페이즈별 변경사항 적용
  applyPhaseChanges(phase) {
    switch (phase) {
      case 2:
        // 2페이즈: 속도 증가
        this.walkSpeed *= 1.3;
        this.runSpeed *= 1.3;
        this.attackRange *= 1.2;

        // 스킬 쿨다운 감소
        if (this.enemy.skillSystem) {
          this.enemy.skillSystem.globalCooldownMultiplier = 0.7;
        }
        break;

      case 3:
        // 3페이즈: 더욱 강화
        this.walkSpeed *= 1.5;
        this.runSpeed *= 1.5;
        this.attackRange *= 1.3;

        if (this.enemy.skillSystem) {
          this.enemy.skillSystem.globalCooldownMultiplier = 0.5;
        }
        break;
    }
  }

  setMoveState(state) {
    if (!this.enemy || !this.enemy.sprite) return;

    this.currentMoveState = state;
    const animKey = `${this.enemy.enemyType}_${state}`;
    if (this.enemy.scene.anims.exists(animKey)) {
      this.enemy.sprite.play(animKey, true);
    }
  }

  moveTowardTarget(targetX, targetY, speed) {
    // 고정 보스는 이동 안 함
    if (this.enemy.isStationary) return;

    if (this.enemy.isDead || !this.enemy.sprite.body) return;

    const angle = Phaser.Math.Angle.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      targetX,
      targetY,
    );

    this.enemy.sprite.body.setVelocityX(Math.cos(angle) * speed);

    if (!this.enemy.isLockingDirection) {
      this.enemy.direction = Math.cos(angle) > 0 ? 1 : -1;
    }
  }

  tryAttackOrSkill(time) {
    if (this.enemy.isBeingHit) return;
    if (this.isInAttackState) return;
    if (!this.enemy.skillSystem) {
      return;
    }
    if (!this.target || !this.target.sprite || !this.target.sprite.active) return;

    const usableSkills = this.enemy.skillSystem.getUsableSkills(this.target);
    if (usableSkills.length === 0) {
      return;
    }

    let availableSkills = usableSkills;
    if (this.skillNames.length > 0) {
      availableSkills = usableSkills.filter((skill) => {
        const skillName = skill.name || skill.config?.name;
        return this.skillNames.includes(skillName);
      });
    }

    if (availableSkills.length === 0) {
      return;
    }

    const targetX = this.target.sprite ? this.target.sprite.x : this.target.x;
    const targetY = this.target.sprite ? this.target.sprite.y : this.target.y;
    const enemyX = this.enemy.sprite ? this.enemy.sprite.x : this.enemy.x;
    const enemyY = this.enemy.sprite ? this.enemy.sprite.y : this.enemy.y;
    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);

    let sizeOffset = 0;
    if (this.enemy.sprite.body && this.target.sprite.body) {
      sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    } else {
      sizeOffset = 50;
    }

    const currentDistance = dist - sizeOffset;

    availableSkills = availableSkills.filter((skill) => {
      const config = skill.config;

      if (config.range !== undefined) {
        if (currentDistance > config.range) {
          return false;
        }
      }

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

    availableSkills.sort((a, b) => {
      const priorityA = a.config?.priority || 0;
      const priorityB = b.config?.priority || 0;
      return priorityB - priorityA;
    });

    const selectedSkill = availableSkills[0];
    const skillName = selectedSkill.name || selectedSkill.config?.name;

    // 수정: 스킬 사용 후 isInAttackState 설정 (스킬 duration만큼 지속)
    this.isInAttackState = true;
    const skillDuration = selectedSkill.config?.duration || 500;

    // 스킬 종료 후 공격 상태 해제
    this.enemy.scene.time.delayedCall(skillDuration, () => {
      this.isInAttackState = false;
    });

    this.enemy.skillSystem.useSkill(skillName, this.target);
  }

  isUsingSkill() {
    if (!this.enemy.skillSystem) return false;

    for (const skill of this.enemy.skillSystem.skills.values()) {
      if (skill.isActive) return true;
    }
    return false;
  }
}
