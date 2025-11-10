export default class StateMachine {
  constructor(sprite, animManager, onStateChangeCallback) {
    this.sprite = sprite;
    this.animManager = animManager;
    this.onStateChangeCallback = onStateChangeCallback;

    this.currentState = 'idle';
    this.previousState = null;

    this.isLocked = false;
    this.lockTimer = null;
    this.animCompleteHandler = null;
  }

  changeState(newState) {
    if (this.isLocked && newState !== this.currentState) {
      return false;
    }

    if (this.currentState === newState) {
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!this.animManager.exists(newState)) {
      console.warn(`Animation '${newState}' does not exist`);
      return false;
    }

    this.animManager.play(this.sprite, newState);

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.previousState, this.currentState);
    }

    this.setupStateLock(newState);

    return true;
  }

  setupStateLock(state) {
    this.clearLock();

    // 접두사 제거
    const baseState = state.includes('-') ? state.split('-')[1] : state;

    const lockStates = [
      'attack',
      'attack_1',
      'q_skill',
      'w_skill',
      'air_attack',
      'attack_air',
      'r_skill',
      'skill_punch',
      'skill_kick',
      'skill_meditation',
      'skill_special',
      'e_skill',
      's_skill',
      'fireball',
      'ice_shard',
      'lightning',
    ];

    if (lockStates.includes(baseState)) {
      this.isLocked = true;

      this.animCompleteHandler = () => {
        if (this.currentState === state) {
          this.unlock();
          const onGround = this.sprite.body?.touching.down || false;
          this.changeState(onGround ? 'idle' : 'jump');
        }
      };

      this.sprite.once('animationcomplete', this.animCompleteHandler);

      const maxDuration = this.getStateDuration(baseState);
      this.lockTimer = setTimeout(() => {
        if (this.isLocked && this.currentState === state) {
          console.warn(`State '${state}' exceeded max duration, force unlocking`);
          this.unlock();
          const onGround = this.sprite.body?.touching.down || false;
          this.changeState(onGround ? 'idle' : 'jump');
        }
      }, maxDuration);
    }
  }

  getStateDuration(state) {
    const baseState = state.includes('-') ? state.split('-')[1] : state;

    const durations = {
      attack: 600,
      attack_1: 600,
      q_skill: 650,
      w_skill: 700,
      air_attack: 650,
      attack_air: 650,
      r_skill: 800,
      skill_punch: 800,
      skill_kick: 800,
      skill_meditation: 2500,
      skill_special: 1000,
      e_skill: 2500,
      roll: 600,
      fireball: 600,
      ice_shard: 600,
      lightning: 400,
    };

    return durations[baseState] || 1000;
  }

  clearLock() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }

    if (this.animCompleteHandler) {
      this.sprite.off('animationcomplete', this.animCompleteHandler);
      this.animCompleteHandler = null;
    }
  }

  lock(duration) {
    this.clearLock();
    this.isLocked = true;

    this.lockTimer = setTimeout(() => {
      this.unlock();
    }, duration);
  }

  unlock() {
    this.clearLock();
    this.isLocked = false;
  }

  isState(state) {
    return this.currentState === state;
  }

  isStateLocked() {
    return this.isLocked;
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }

  destroy() {
    this.clearLock();
    this.sprite = null;
    this.animManager = null;
    this.onStateChangeCallback = null;
  }
}
