import Phaser from 'phaser';

export default class SoulScene extends Phaser.Scene {
  constructor() {
    super('SoulScene');
  }

  preload() {
    this.load.spritesheet('soul', 'src/assets/images/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image('enemy', 'src/assets/images/enemy.png');
  }

  create() {
    // 배경
    // this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);

    // 플레이어 생성
    this.player = this.physics.add
      .sprite(this.scale.width / 2, this.scale.height / 2, 'soul')
      .setScale(2);
    this.player.setCollideWorldBounds(true);

    this.moveSpeed = 200;
    this.playerState = 'idle';

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.isJumping = false; // 점프 중인지 여부
    this.jumpHeight = 40; // 점프 높이
    this.jumpDuration = 600; // 점프 총 시간(ms)

    // 흡수용
    this.absorbHoldTime = 500;
    this.absorbKeyDownTime = 0;

    // 적 생성
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const enemy = this.enemies.create(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(50, this.scale.height - 50),
        'enemy',
      );
      enemy.setImmovable(true);
    }

    this.physics.add.overlap(this.player, this.enemies, this.onPlayerOverlap, null, this);

    // 애니메이션 정의
    this.createAnimations();

    // 초기 상태
    this.changePlayerState('idle');
  }

  bodyIsMoving() {
    return (
      this.cursors.left.isDown ||
      this.cursors.right.isDown ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown
    );
  }

  jump() {
    if (this.isJumping) return;

    this.isJumping = true;
    this.changePlayerState('jump');

    const startY = this.player.y;

    this.tweens.add({
      targets: this.player,
      y: startY - this.jumpHeight,
      duration: this.jumpDuration / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.isJumping = false;
        // 점프 끝난 후 이동 상태로 전환
        if (this.bodyIsMoving()) this.changePlayerState('walk');
        else this.changePlayerState('idle');
      },
    });
  }

  createAnimations() {
    const anims = [
      { key: 'idle', start: 0, end: 1, frameRate: 3, repeat: -1 },
      { key: 'walk', start: 25, end: 32, frameRate: 6, repeat: -1 },
      { key: 'jump', start: 41, end: 48, frameRate: 8, repeat: 0 },
      { key: 'attack', start: 65, end: 71, frameRate: 12, repeat: 0 },
    ];

    anims.forEach((a) => {
      if (!this.anims.exists(a.key)) {
        this.anims.create({
          key: a.key,
          frames: this.anims.generateFrameNumbers('soul', { start: a.start, end: a.end }),
          frameRate: a.frameRate,
          repeat: a.repeat,
        });
      }
    });
  }

  changePlayerState(newState) {
    if (this.playerState === newState) return; // 깜빡임 방지
    this.playerState = newState;

    // 이벤트 리스너 제거 (중복 방지)
    this.player.off('animationcomplete-jump');
    this.player.off('animationcomplete-attack');

    switch (newState) {
      case 'idle':
      case 'walk':
        if (this.player.anims.currentAnim?.key !== newState) {
          this.player.play(newState, true);
        }
        break;
      case 'jump':
        this.player.play('jump');
        this.player.once('animationcomplete-jump', () => {
          if (this.playerState === 'jump') this.changePlayerState('idle');
        });
        break;
      case 'attack':
        this.player.play('attack');
        this.player.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changePlayerState('idle');
        });
        break;
    }
  }

  update(time, delta) {
    const body = this.player.body;
    body.setVelocity(0);

    let moving = false;

    // 1️⃣ 공격/점프 입력 처리 (먼저 처리)
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.changePlayerState('attack');
    } else if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && this.playerState !== 'attack') {
      this.jump();
    }

    // 2️⃣ 이동 입력 처리
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

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.moveSpeed);
    }

    // 3️⃣ 이동 상태 전환 (점프/공격 중이 아니면)
    if (!this.isJumping && this.playerState !== 'attack') {
      if (moving) this.changePlayerState('walk');
      else this.changePlayerState('idle');
    }

    // 4️⃣ A키 홀드 시간 체크 (흡수)
    if (this.attackKey.isDown) {
      this.absorbKeyDownTime += delta;
    } else {
      this.absorbKeyDownTime = 0;
    }
  }
}
