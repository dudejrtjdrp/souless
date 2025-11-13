import BaseSkillHandler from './BaseSkillHandler';

export default class MovementSkillHandler extends BaseSkillHandler {
  execute(skillName, config) {
    const frameRate = this.getFrameRate(config);
    const lockTime = this.animationController.play(config.animation, frameRate);

    this.lockState(lockTime);
    this.applyMovement(config, lockTime);
    this.applyInvincibility(config, lockTime);
  }

  lockState(duration) {
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  applyMovement(config, animationDuration) {
    if (!config.distance) return;

    const direction = this.character.sprite.flipX ? -1 : 1;
    const speed = config.speed || (config.distance / animationDuration) * 1000;

    this.character.sprite.body.velocity.x = direction * speed;

    this.scene.time.delayedCall(animationDuration, () => {
      this.stopCharacterMovement();
    });
  }

  applyInvincibility(config, animationDuration) {
    if (config.invincible) {
      this.character.setInvincible(animationDuration);
    }
  }
}
