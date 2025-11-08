export default class StateMachine {
  constructor(sprite, animManager, onStateChangeCallback) {
    this.sprite = sprite;
    this.animManager = animManager;
    this.onStateChangeCallback = onStateChangeCallback;

    this.currentState = 'idle';
    this.previousState = null;

    this.isLocked = false;
    this.lockDuration = 0;
  }

  changeState(newState) {
    // 잠금 상태면 변경 불가
    if (this.isLocked && newState !== this.currentState) {
      return false;
    }

    // 같은 상태면 변경 안함
    if (this.currentState === newState) {
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    // 애니메이션 존재 여부 확인
    if (!this.animManager.exists(newState)) {
      console.warn(`Animation '${newState}' does not exist`);
      return false;
    }

    // 애니메이션 재생
    this.animManager.play(this.sprite, newState);

    // 콜백 호출
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.previousState, this.currentState);
    }

    // 공격 상태면 잠금
    if (newState === 'attack') {
      this.lock(500);
      this.setupAttackComplete();
    }

    return true;
  }

  setupAttackComplete() {
    // 공격 애니메이션이 끝나면 자동으로 idle로
    this.sprite.once('animationcomplete', () => {
      if (this.currentState === 'attack') {
        this.unlock();
        this.changeState('idle');
      }
    });
  }

  lock(duration) {
    this.isLocked = true;
    this.lockDuration = duration;

    setTimeout(() => {
      this.unlock();
    }, duration);
  }

  unlock() {
    this.isLocked = false;
  }

  isState(state) {
    return this.currentState === state;
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }
}
