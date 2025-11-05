import Phaser from 'phaser';

export default class Soul {
  constructor(scene, x, y, scale = 1, mapScale = 1) {
    this.scene = scene;
    this.mapScale = mapScale;

    // ✅ Arcade Physics 스프라이트 생성
    this.sprite = scene.physics.add.sprite(x, y, 'soul', 0);
    this.sprite.setScale(scale);
    this.sprite.setDepth(100);

    // ✅ Arcade Physics 설정
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(24, 30); // 충돌 박스 크기
    this.sprite.body.setOffset(4, 2); // 충돌 박스 위치

    this.playerState = 'idle';
    this.isJumping = false;

    this.createAnimations();
    this.changeState('idle');
  }

  createAnimations() {
    const anims = [
      { key: 'idle', start: 0, end: 1, frameRate: 3, repeat: -1 },
      { key: 'walk', start: 25, end: 32, frameRate: 6, repeat: -1 },
      { key: 'jump', start: 41, end: 48, frameRate: 8, repeat: 0 },
      { key: 'attack', start: 65, end: 71, frameRate: 12, repeat: 0 },
    ];

    anims.forEach((a) => {
      if (!this.scene.anims.exists(a.key)) {
        this.scene.anims.create({
          key: a.key,
          frames: this.scene.anims.generateFrameNumbers('soul', { start: a.start, end: a.end }),
          frameRate: a.frameRate,
          repeat: a.repeat,
        });
      }
    });
  }

  changeState(newState) {
    if (this.playerState === newState) return;
    this.playerState = newState;

    this.sprite.off('animationcomplete-jump');
    this.sprite.off('animationcomplete-attack');

    switch (newState) {
      case 'idle':
      case 'walk':
        if (this.sprite.anims.currentAnim?.key !== newState) {
          this.sprite.play(newState, true);
        }
        break;
      case 'jump':
        this.sprite.play('jump');
        this.sprite.once('animationcomplete-jump', () => {
          if (this.playerState === 'jump') this.changeState('idle');
        });
        break;
      case 'attack':
        this.sprite.play('attack');
        this.sprite.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changeState('idle');
        });
        break;
    }
  }

  jump() {
    // ✅ Arcade Physics 바닥 감지
    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;

    if (onGround) {
      this.sprite.setVelocityY(-130 * this.mapScale); // 점프 힘
      this.changeState('jump');
      this.isJumping = true;
    }
  }

  attack() {
    if (!this.sprite.active) return;

    // 공격 범위 Hitbox 생성
    const attackHitbox = this.scene.physics.add.sprite(
      this.sprite.x + (this.sprite.flipX ? -20 : 20),
      this.sprite.y,
      null,
    );
    attackHitbox.setSize(20, 20);
    attackHitbox.body.allowGravity = false;

    // EnemyManager에 있는 모든 적과 충돌 처리
    this.scene.enemyManager.enemies.forEach((enemy) => {
      this.scene.physics.add.overlap(attackHitbox, enemy.sprite, () => {
        enemy.takeDamage(1);
      });
    });

    // 잠깐 후 hitbox 제거
    this.scene.time.delayedCall(100, () => attackHitbox.destroy());
  }

  update() {
    const speed = 100 * this.mapScale;
    const cursors = this.scene.cursors;
    const attackKey = this.scene.attackKey;
    const jumpKey = this.scene.jumpKey;

    // ✅ 바닥 체크
    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;

    if (onGround && this.isJumping) {
      this.isJumping = false;
      if (this.playerState === 'jump') {
        this.changeState('idle');
      }
    }

    // 좌우 이동
    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
      if (!this.isJumping && this.playerState !== 'attack') {
        this.changeState('walk');
      }
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
      if (!this.isJumping && this.playerState !== 'attack') {
        this.changeState('walk');
      }
    } else {
      this.sprite.setVelocityX(0);
      if (!this.isJumping && this.playerState !== 'attack') {
        this.changeState('idle');
      }
    }

    // 점프
    if (Phaser.Input.Keyboard.JustDown(jumpKey)) {
      this.jump();
    }

    // 공격
    if (Phaser.Input.Keyboard.JustDown(attackKey) && !this.isJumping) {
      this.changeState('attack');
      // this.attack();
      this.scene.time.delayedCall(400, () => {
        if (this.scene.enemyManager) {
          this.attack();
        }
      });
    }
  }
}
