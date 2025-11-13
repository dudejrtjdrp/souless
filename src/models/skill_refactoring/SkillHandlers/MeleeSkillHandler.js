import BaseSkillHandler from './BaseSkillHandler';

export default class MeleeSkillHandler extends BaseSkillHandler {
  execute(skillName, config, skillHitbox) {
    const frameRate = this.getFrameRate(config);
    // config.duration을 전달하지 않으면 애니메이션 길이로 자동 계산됨
    const lockTime = this.animationController.play(config.animation, frameRate);

    this.lockState(lockTime);
    this.activateHitbox(skillHitbox, config, lockTime);
  }

  lockState(duration) {
    const sprite = this.character.sprite;
    const body = sprite.body;

    const isAirborne = !body?.touching.down;

    if (isAirborne) {
      // 1️⃣ 공중에서 멈추기
      body.setVelocityY(0);
      body.setVelocityX(0);
      body.setAllowGravity(false);
    }

    // 2️⃣ 상태 잠금 + 해제 처리
    this.stateLockManager.lock(duration, () => {
      if (isAirborne) {
        // 3️⃣ 공격 끝난 뒤 다시 중력 복원
        body.setAllowGravity(true);
      }

      const onGround = body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  activateHitbox(skillHitbox, config, animationDuration) {
    if (!skillHitbox) return;

    const delay = config.hitboxDelay || 0;

    if (delay > 0) {
      this.scene.time.delayedCall(delay, () => skillHitbox.activate(animationDuration));
    } else {
      skillHitbox.activate(animationDuration);
    }
  }
}
