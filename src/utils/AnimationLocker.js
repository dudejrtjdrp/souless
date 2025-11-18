export class AnimationLocker {
  constructor(character, scene) {
    this.character = character;
    this.scene = scene;
    this.currentLockTimer = null;
    this.currentAnimKey = null;
  }

  playWithLock(animationKey, frameRate = 10, skillDuration = null) {
    const sprite = this.character.sprite;
    if (!sprite || !sprite.anims) {
      console.error('[AnimationLocker] sprite or anims is null');
      return 0;
    }

    sprite.anims.play(animationKey, true);

    if (sprite.anims.currentAnim) {
      sprite.anims.currentAnim.frameRate = frameRate;
      sprite.anims.msPerFrame = 1000 / frameRate;
    }

    let lockTime = skillDuration;
    if (!lockTime) {
      const anim = sprite.anims.animationManager.get(animationKey);
      if (anim) {
        lockTime = (anim.frames.length / frameRate) * 1000;
      } else {
        lockTime = 0;
      }
    }

    // stateMachine 락
    if (this.character.stateMachine) {
      this.character.stateMachine.currentState = animationKey;
      this.character.stateMachine.isLocked = true;
      if (this.currentLockTimer) {
        clearTimeout(this.currentLockTimer);
        this.currentLockTimer = null;
      }
      this.currentLockTimer = setTimeout(() => {
        if (this.character.stateMachine) {
          this.character.stateMachine.isLocked = false;
          this.character.stateMachine.lockTimer = null;
          const onGround = this.character.sprite.body?.touching.down || false;
          if (this.character.stateMachine.changeState) {
            this.character.stateMachine.changeState(onGround ? 'idle' : 'jump');
          }
        }
        this.currentLockTimer = null;
      }, lockTime);
    }

    this.currentAnimKey = animationKey;
    return lockTime;
  }

  // 즉시 락 해제 + 애니메이션 복구 (예: 채널링 중단)
  releaseAndPlayIdle() {
    if (this.currentLockTimer) {
      clearTimeout(this.currentLockTimer);
      this.currentLockTimer = null;
    }
    if (this.character.stateMachine) {
      this.character.stateMachine.isLocked = false;
      this.character.stateMachine.lockTimer = null;
      const onGround = this.character.sprite.body?.touching.down || false;
      if (this.character.stateMachine.changeState) {
        this.character.stateMachine.changeState(onGround ? 'idle' : 'jump');
      }
    }

    const sprite = this.character.sprite;
    if (sprite && sprite.anims) {
      sprite.off('animationupdate');
      sprite.anims.stop();
      sprite.anims.play(this.character.sprite.texture.key + '-idle', true);
    }
    this.currentAnimKey = null;
  }
}
