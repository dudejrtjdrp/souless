export default class BaseSkillHandler {
  constructor(scene, character, animationController, stateLockManager) {
    this.scene = scene;
    this.character = character;
    this.animationController = animationController;
    this.stateLockManager = stateLockManager;
  }

  getFrameRate(config) {
    return config.frameRate || 10;
  }

  stopCharacterMovement() {
    if (this.character.sprite.body) {
      this.character.sprite.body.setVelocityX(0);
    }
  }
}
