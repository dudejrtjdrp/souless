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
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
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
