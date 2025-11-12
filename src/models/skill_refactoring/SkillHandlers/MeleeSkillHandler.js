import BaseSkillHandler from './BaseSkillHandler';

export default class MeleeSkillHandler extends BaseSkillHandler {
  execute(skillName, config, skillHitbox) {
    const frameRate = this.getFrameRate(config);
    const lockTime = this.animationController.play(config.animation, frameRate, config.duration);

    this.lockState(lockTime);
    this.activateHitbox(skillHitbox, config);
  }

  lockState(duration) {
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  activateHitbox(skillHitbox, config) {
    if (!skillHitbox) return;

    const delay = config.hitboxDelay || 0;
    if (delay > 0) {
      this.scene.time.delayedCall(delay, () => skillHitbox.activate());
    } else {
      skillHitbox.activate();
    }
  }
}
