export default class MovementController {
  constructor(sprite, config) {
    this.sprite = sprite;
    this.config = {
      walkSpeed: config.walkSpeed || 200,
      runSpeed: config.runSpeed || 350,
      jumpPower: config.jumpPower || 300,
      maxJumps: config.maxJumps || 2,
    };

    this.jumpCount = 0;
    this.groundCheckDelay = 100; // 착지 감지 딜레이
    this.lastGroundTime = 0;
  }

  handleHorizontalMovement(cursors, isRunning) {
    const speed = isRunning ? this.config.runSpeed : this.config.walkSpeed;

    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }
  }

  jump() {
    if (this.jumpCount >= this.config.maxJumps) {
      return false;
    }

    this.sprite.setVelocityY(-this.config.jumpPower);
    this.jumpCount++;
    return true;
  }

  isOnGround() {
    return this.sprite.body.blocked.down || this.sprite.body.touching.down;
  }

  resetJumpCount() {
    this.jumpCount = 0;
  }

  getVelocity() {
    return {
      x: this.sprite.body.velocity.x,
      y: this.sprite.body.velocity.y,
    };
  }
}
