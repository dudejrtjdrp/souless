export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');

    // 키 입력
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      absorb: Phaser.Input.Keyboard.KeyCodes.SPACE, // 흡수는 스페이스로 임시
    });

    this.speed = 200;
    this.isAbsorbing = false;
  }

  update() {
    this.handleMovement();
  }

  handleMovement() {
    const { up, down, left, right } = this.keys;
    const sprite = this.sprite;

    // 속도 초기화
    sprite.setVelocity(0);

    // 방향 이동 처리
    if (up.isDown) sprite.setVelocityY(-this.speed);
    else if (down.isDown) sprite.setVelocityY(this.speed);

    if (left.isDown) sprite.setVelocityX(-this.speed);
    else if (right.isDown) sprite.setVelocityX(this.speed);

    // 대각선 속도 조정
    sprite.body.velocity.normalize().scale(this.speed);
  }

  onCollideEnemy(enemySprite) {
    if (this.keys.absorb.isDown) {
      this.startAbsorb(enemySprite);
    }
  }

  startAbsorb(enemySprite) {
    if (this.isAbsorbing) return;

    this.isAbsorbing = true;
    this.scene.time.delayedCall(300, () => {
      if (this.keys.absorb.isDown) {
        enemySprite.destroy();
        console.log('경험치 흡수!');
      }
      this.isAbsorbing = false;
    });
  }
}
