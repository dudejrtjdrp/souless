import BaseSkillHandler from './BaseSkillHandler';
import { throttle } from '../../../utils/throttle';

export default class ChannelingSkillHandler extends BaseSkillHandler {
  execute(skillName, config) {
    if (!this.applyEffectByConfig) {
      this.applyEffectByConfig = throttle(() => {
        this.applyEffects(config);
      }, 700);
    }
    this.config = config;
    const frameRate = this.getFrameRate(config);

    this.stateLockManager.stateMachine.isLocked = true;
    this.playChannelingAnimation(skillName, config);
    this.scheduleChannelingEffects(config);

    return skillName[0]; // return key name for tracking
  }

  playChannelingAnimation(skillName, config) {
    const animKey = this.animationController.resolveAnimationKey(skillName);
    console.log(skillName, animKey);
    this.animationController.playAnimation(animKey, this.getFrameRate(config));
    this.animationController.playAnimation(`${animKey}_channeling`, this.getFrameRate(config));
    console.log(config);
  }

  scheduleChannelingEffects(config) {
    this.scene.time.delayedCall(config.duration, () => {
      this.applyEffects(config);
    });
  }

  update() {
    this.applyEffectByConfig();
  }

  applyEffects(config) {
    if (config?.effects?.includes('heal')) {
      this.character.heal(config.healAmount || 0);
    }

    if (config?.effects?.includes('mana_regen')) {
      this.character.restoreMana(config.manaAmount || 0);
    }
  }

  stop(animationController, stateLockManager) {
    stateLockManager.forceUnlock();
    animationController.stopAndClearEvents();
    animationController.playIdle();

    const onGround = this.character.sprite.body?.touching.down || false;
    this.character.stateMachine.changeState?.(onGround ? 'idle' : 'jump');
  }
}
