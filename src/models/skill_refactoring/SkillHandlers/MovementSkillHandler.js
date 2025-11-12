import BaseSkillHandler from './BaseSkillHandler';

export default class MovementSkillHandler extends BaseSkillHandler {
  execute(skillName, config) {
    const frameRate = this.getFrameRate(config);
    const lockTime = this.animationController.play(config.animation, frameRate, config.duration);

    this.lockState(lockTime);
    this.applyMovement(config);
    this.applyInvincibility(config);
  }

  lockState(duration) {
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  applyMovement(config) {
    if (!config.distance) return;

    const direction = this.character.sprite.flipX ? -1 : 1;
    const speed = config.speed || (config.distance / config.duration) * 1000;

    this.character.sprite.body.velocity.x = direction * speed;

    this.scene.time.delayedCall(config.duration, () => {
      this.stopCharacterMovement();
    });
  }

  applyInvincibility(config) {
    if (config.invincible) {
      this.character.setInvincible(config.duration);
    }
  }
}
