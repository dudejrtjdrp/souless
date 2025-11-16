import BaseSkillHandler from './BaseSkillHandler';

export default class InstantSkillHandler extends BaseSkillHandler {
  execute(skillName, config, skillHitbox) {
    const frameRate = this.getFrameRate(config);
    const lockTime = this.animationController.play(config.animation, frameRate);

    this.lockState(lockTime);
    this.activateHitbox(skillHitbox, config, lockTime);
  }

  lockState(duration) {
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  activateHitbox(skillHitbox, config, animationDuration) {
    if (!skillHitbox) return;

    if (config.hitboxSequence) {
      // hitboxSequence의 각 step에 duration 계산해서 전달
      const sequenceWithDuration = config.hitboxSequence.map((step) => ({
        ...step,
        duration: this.calculateStepDuration(step, animationDuration),
      }));
      skillHitbox.activateSequence(sequenceWithDuration);
    } else {
      const delay = config.hitboxDelay || 0;

      if (delay > 0) {
        this.scene.time.delayedCall(delay, () => skillHitbox.activate(animationDuration));
      } else {
        skillHitbox.activate(animationDuration);
      }
    }
  }

  calculateStepDuration(step, animationDuration) {
    // ⭐ 우선순위: step.duration > step.hitbox.duration > animationDuration
    if (step.duration) return step.duration;
    if (step.hitbox && step.hitbox.duration) return step.hitbox.duration;

    // 둘 다 없으면 애니메이션 duration 사용
    return animationDuration;
  }
}
