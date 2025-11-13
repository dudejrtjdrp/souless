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

    this.stateLockManager.stateMachine.isLocked = true;
    this.playChannelingAnimation(skillName, config);
    this.scheduleChannelingEffects(config);

    return skillName[0];
  }

  playChannelingAnimation(skillName, config) {
    const animKey = this.animationController.resolveAnimationKey(skillName);
    const frameRate = this.getFrameRate(config);

    this.animationController.playAnimation(animKey, frameRate);

    this.animationController.playAnimation(`${animKey}_channeling`, config.frameRate);
  }

  scheduleChannelingEffects(config) {
    if (config.channeling?.maxDuration) {
      this.scene.time.delayedCall(config.channeling.maxDuration, () => {
        this.applyEffects(config);
      });
    }
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
