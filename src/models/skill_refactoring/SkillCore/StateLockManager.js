export default class StateLockManager {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.lockTimer = null;
  }

  setPrevState(prevStateKey) {
    console.log(prevStateKey);
    this.prevStateKey = prevStateKey;
  }

  getPrevState() {
    return this.prevStateKey;
  }

  lock(duration, onUnlock) {
    this.clearExistingLock();

    this.stateMachine.isLocked = true;
    this.lockTimer = setTimeout(() => {
      this.unlock();
      onUnlock?.();
    }, duration);
  }

  unlock() {
    this.stateMachine.isLocked = false;
    this.lockTimer = null;
  }

  clearExistingLock() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  forceUnlock() {
    this.clearExistingLock();
    this.unlock();
  }
}
