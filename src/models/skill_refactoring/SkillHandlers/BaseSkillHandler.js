export default class BaseSkillHandler {
  constructor(scene, character, animationController, stateLockManager) {
    this.character = character;
    this.scene = scene;
    this.animationController = animationController;
    this.stateLockManager = stateLockManager;
  }

  getFrameRate(config) {
    // animations 데이터에서 frameRate 가져오기
    console.log(config);
    if (config.animation && this.character.data?.animations) {
      const animData = this.character.data.animations.find((anim) => anim.key === config.animation);
      if (animData?.frameRate) {
        return animData.frameRate;
      }
    }
    // fallback: config에 직접 frameRate가 있으면 사용
    return config.frameRate;
  }

  stopCharacterMovement() {
    if (this.character.sprite.body) {
      this.character.sprite.body.velocity.x = 0;
    }
  }
}
