export default class StateLockManager {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.lockTimer = null;
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
