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
    this.wasOnGround = false;
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

  update() {
    const isCurrentlyOnGround = this.isOnGround();

    if (isCurrentlyOnGround && !this.wasOnGround) {
      this.resetJumpCount();
    }

    this.wasOnGround = isCurrentlyOnGround;
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
