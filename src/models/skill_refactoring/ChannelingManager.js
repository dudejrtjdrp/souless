import { throttle } from '../../utils/throttle';

export default class ChannelingManager {
  constructor(inputHandler) {
    this.inputHandler = inputHandler;
    this.currentKeyName = null;
    this.throttledConsumeMana = null;
  }

  startChanneling(keyName) {
    this.currentKeyName = keyName;
  }

  isChanneling() {
    return this.currentKeyName !== null;
  }

  update(character, skill, config, onStop) {
    if (!this.currentKeyName) return;

    this.handleVelocity(character);

    if (this.inputHandler.isReleased(this.currentKeyName)) {
      this.stop(onStop);
      return;
    }

    if (this.inputHandler.isHeld(this.currentKeyName)) {
      this.consumeManaThrottled(character, config);
    }
  }

  handleVelocity(character) {
    if (character.stateMachine.isLocked && character.sprite.body) {
      character.sprite.body.setVelocityX(0);
    }
  }

  consumeManaThrottled(character, config) {
    if (!this.throttledConsumeMana) {
      this.throttledConsumeMana = throttle(() => {
        character.mana -= config.channeling.manaPerTick;
      }, 500);
    }

    this.throttledConsumeMana();
  }

  stop(callback) {
    callback?.();
    this.currentKeyName = null;
    this.throttledConsumeMana = null;
  }

  reset() {
    this.currentKeyName = null;
    this.throttledConsumeMana = null;
  }
}
