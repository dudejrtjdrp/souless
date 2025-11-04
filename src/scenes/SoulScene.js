import Phaser from 'phaser';

export default class SoulScene extends Phaser.Scene {
  constructor() {
    super('SoulScene');
  }

  create() {
    // 배경
    this.bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);

    // 영혼 (플레이어)
    this.player = this.add.circle(this.scale.width / 2, this.scale.height / 2, 20, 0xffffff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.moveSpeed = 300;
  }

  update() {
    const body = this.player.body;
    body.setVelocity(0);

    if (this.cursors.left.isDown) body.setVelocityX(-this.moveSpeed);
    if (this.cursors.right.isDown) body.setVelocityX(this.moveSpeed);
    if (this.cursors.up.isDown) body.setVelocityY(-this.moveSpeed);
    if (this.cursors.down.isDown) body.setVelocityY(this.moveSpeed);

    body.velocity.normalize().scale(this.moveSpeed);
  }
}
