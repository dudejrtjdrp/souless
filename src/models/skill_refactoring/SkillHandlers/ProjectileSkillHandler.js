import BaseSkillHandler from './BaseSkillHandler';

export default class ProjectileSkillHandler extends BaseSkillHandler {
  execute(skillName, config) {
    const frameRate = this.getFrameRate(config);
    const lockTime = this.animationController.play(config.animation, frameRate, config.duration);

    this.lockState(lockTime);
    this.castProjectile(skillName);
  }

  lockState(duration) {
    this.stateLockManager.lock(duration, () => {
      const onGround = this.character.sprite.body?.touching.down || false;
      this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
    });
  }

  castProjectile(skillName) {
    const isLeft = this.character.sprite.flipX;

    if (this.character.magicSystem) {
      this.character.magicSystem.castSpell(skillName, isLeft);
    } else {
      console.warn(`Magic system not found for skill: ${skillName}`);
    }
  }
}
