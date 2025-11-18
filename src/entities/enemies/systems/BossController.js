import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillCooldown = config.skillCooldown || 3000;
    this.lastSkillTime = 0;
    this.skillNames = config.skills || [];

    // 이동 설정
    this.walkSpeed = enemy.speed;
    this.runSpeed = enemy.data.stats.runSpeed || enemy.speed * 2;
    this.walkRange = config.walkRange || 200;
    this.runRange = config.runRange || 200;

    this.currentMoveState = 'walk';
    this.isUsingSkill = false;
  }

  update(time, delta) {
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

    const dist = Phaser.Math.Distance.Between(enemyX, enemyY, targetX, targetY);
    const sizeOffset = this.enemy.sprite.body.width / 2 + this.target.sprite.body.width / 2;
    const realDist = dist - sizeOffset;

    // 스킬 사용 중이면 이동 제한
    if (this.isUsingSkill) {
      return;
    }

    // 공격 범위 내
    if (realDist <= this.attackRange) {
      if (this.enemy.sprite.body) {
        this.enemy.sprite.body.setVelocityX(0);
        this.enemy.sprite.body.setVelocityY(0);
      }

      if (this.currentMoveState !== 'idle' && !this.isInAttackState) {
        this.setMoveState('idle');
      }

      this.tryAttack(time);
    }
    // 달리기 범위
    else if (realDist <= this.runRange) {
      if (!this.isInAttackState) {
        this.setMoveState('run');
        this.moveTowardTarget(targetX, targetY, this.runSpeed);
      }
    }
    // 걷기 범위
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

    // 스킬 사용 시도
    const timeSinceLastSkill = time - this.lastSkillTime;
    if (this.target && timeSinceLastSkill >= this.skillCooldown) {
      this.tryUseSkill(time);
    }
  }

  setMoveState(state) {
    if (this.currentMoveState === state) return;

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
    this.enemy.direction = Math.cos(angle) > 0 ? 1 : -1;
  }

  /**
   * 스킬 사용 시도
   */
  tryUseSkill(time) {
    if (!this.enemy.skillSystem) {
      console.warn('⚠️ No skill system for', this.enemy.enemyType);
      return;
    }

    // ✅ getUsableSkills가 Skill 객체 배열을 반환함
    const usableSkills = this.enemy.skillSystem.getUsableSkills(this.target);

    if (usableSkills.length === 0) {
      return;
    }

    // skillNames 필터링
    let availableSkills = usableSkills;
    if (this.skillNames.length > 0) {
      availableSkills = usableSkills.filter((skill) => {
        // ✅ Skill 객체에서 이름 가져오기
        const skillName = skill.name || skill.config?.name;
        return this.skillNames.includes(skillName);
      });
    }

    if (availableSkills.length === 0) {
      return;
    }

    // 우선순위 정렬
    availableSkills.sort((a, b) => {
      const priorityA = a.config?.priority || 0;
      const priorityB = b.config?.priority || 0;
      return priorityB - priorityA;
    });

    // 상위 2개 중 랜덤 선택
    const topSkills = availableSkills.slice(0, Math.min(2, availableSkills.length));
    const selectedSkill = Phaser.Utils.Array.GetRandom(topSkills);

    // ✅ Skill 객체에서 이름 추출
    const skillName = selectedSkill.name || selectedSkill.config?.name;

    // 스킬 실행
    this.isUsingSkill = true;

    // ✅ useSkill 메서드 호출 (올바른 메서드)
    const success = this.enemy.skillSystem.useSkill(skillName, this.target);

    if (success) {
      this.lastSkillTime = time;
      console.log(`🔥 Boss used skill: ${skillName}`);

      // 스킬 지속 시간 계산
      const config = selectedSkill.config;
      const hitDelay = config?.hitDelay || 300;
      const duration = config?.duration || 1000;
      const totalTime = hitDelay + duration;

      // 스킬 종료 후 플래그 해제
      this.enemy.scene.time.delayedCall(totalTime, () => {
        this.isUsingSkill = false;
      });
    } else {
      this.isUsingSkill = false;
    }
  }
}
