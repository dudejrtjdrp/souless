import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // 타일셋 이미지
    this.load.image('tiles', 'assets/map/terrain_and_props.png');
    // TMJ 맵 JSON
    this.load.tilemapTiledJSON('map', 'assets/map/map.tmj');
    // 스프라이트 시트
    this.load.spritesheet('soul', 'assets/sprites/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    // 적 예시
    this.load.image('enemy', 'assets/images/enemy.png');
  }

  create() {
    // Tilemap과 Tileset 연결
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('terrain_and_props', 'tiles');
    // 'terrain_and_props'는 Tiled에서 tileset 이름과 동일해야 함

    // 레이어 생성
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    const propsLayer = map.createLayer('Props', tileset, 0, 0);

    // 충돌 처리
    propsLayer.setCollisionByProperty({ collides: true });

    // 플레이어 생성
    this.player = this.physics.add.sprite(100, 100, 'soul');
    this.player.setCollideWorldBounds(true);
    this.moveSpeed = 200;

    // 애니메이션 정의
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('soul', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('soul', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1,
    });

    this.player.play('idle');

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();

    // 적 그룹
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const enemy = this.enemies.create(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(50, this.scale.height - 50),
        'enemy',
      );
      enemy.setImmovable(true);
    }

    // 충돌 처리
    this.physics.add.collider(this.player, propsLayer);
    this.physics.add.collider(this.player, this.enemies);
  }

  update() {
    const body = this.player.body;
    body.setVelocity(0);

    let moving = false;

    if (this.cursors.left.isDown) {
      body.setVelocityX(-this.moveSpeed);
      this.player.setFlipX(true);
      moving = true;
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(this.moveSpeed);
      this.player.setFlipX(false);
      moving = true;
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-this.moveSpeed);
      moving = true;
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(this.moveSpeed);
      moving = true;
    }

    body.velocity.normalize().scale(this.moveSpeed);

    // 애니메이션 전환
    if (moving) {
      if (this.player.anims.currentAnim.key !== 'walk') this.player.play('walk');
    } else {
      if (this.player.anims.currentAnim.key !== 'idle') this.player.play('idle');
    }
  }
}
