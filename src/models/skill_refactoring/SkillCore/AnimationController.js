export default class AnimationController {
  constructor(sprite) {
    this.sprite = sprite;
  }

  play(animationKey, frameRate) {
    console.log(this.sprite.stateMachine);
    const finalKey = this.resolveAnimationKey(animationKey);
    if (!finalKey) return 0;

    this.playAnimation(finalKey, frameRate);
    return this.calculateLockTime(finalKey, frameRate);
  }

  resolveAnimationKey(animationKey) {
    const characterType = this.sprite.texture.key;
    const prefixedKey = `${characterType}-${animationKey}`;
    const animManager = this.sprite.anims.animationManager;

    if (animManager.anims.has(prefixedKey)) {
      return prefixedKey;
    }

    if (animManager.anims.has(animationKey)) {
      return animationKey;
    }

    console.error(`Animation not found: ${animationKey} or ${prefixedKey}`);
    return null;
  }

  playAnimation(key, frameRate) {
    this.sprite.anims.play(key, true);

    if (this.sprite.anims.currentAnim) {
      this.sprite.anims.currentAnim.frameRate = frameRate;
      this.sprite.anims.msPerFrame = 1000 / frameRate;
    }
  }

  calculateLockTime(animKey, frameRate) {
    const anim = this.sprite.anims.animationManager.get(animKey);
    if (!anim) return 0;

    const frameCount = anim.frames.length;
    console.log(frameCount);
    return (frameCount / frameRate) * 1000;
  }

  pauseAtFrame(frameNumber, callback) {
    this.sprite.on('animationupdate', (animation, frame) => {
      if (frame.textureFrame === frameNumber) {
        this.sprite.anims.pause();
        callback?.();
      }
    });
  }

  stopAndClearEvents() {
    this.sprite.off('animationupdate');
    this.sprite.anims.stop();
  }

  playIdle() {
    const idleKey = `${this.sprite.texture.key}-idle`;
    this.sprite.anims.play(idleKey, true);
  }
}
