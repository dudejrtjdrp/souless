import Phaser from 'phaser';

export default class Soul {
  constructor(scene, x, y, scale = 1, mapScale = 1) {
    this.scene = scene;
    this.mapScale = mapScale;

    this.sprite = scene.physics.add.sprite(x, y, 'soul', 0);
    this.sprite.setScale(scale);
    this.sprite.setDepth(100);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(24, 30);
    this.sprite.body.setOffset(4, 2);

    this.playerState = 'idle';
    this.isJumping = false;

    // ✅ 공격용 hitbox
    this.attackHitbox = scene.add.rectangle(x, y, 40, 30, 0xff0000, 0.3);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.body.setAllowGravity(false);

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
        if (this.sprite.anims.currentAnim?.key !== newState) this.sprite.play(newState, true);
        break;
      case 'jump':
        this.sprite.play('jump');
        this.sprite.once('animationcomplete-jump', () => {
          if (this.playerState === 'jump') this.changeState('idle');
        });
        break;
      case 'attack':
        this.sprite.play('attack');
        // 공격 시작 시 hitbox 활성화
        this.activateHitbox();
        this.sprite.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changeState('idle');
        });
        break;
    }
  }

  activateHitbox() {
    // hitbox 활성화
    this.attackHitbox.body.enable = true;

    // 위치를 공격 방향으로 맞춤
    const offsetX = this.sprite.flipX ? -30 : 30;
    this.attackHitbox.x = this.sprite.x + offsetX;
    this.attackHitbox.y = this.sprite.y;

    // 1초 후 hitbox 비활성화
    this.scene.time.delayedCall(1000, () => {
      this.attackHitbox.body.enable = false;
    });
  }

  jump() {
    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;
    if (onGround) {
      this.sprite.setVelocityY(-130 * this.mapScale);
      this.changeState('jump');
      this.isJumping = true;
    }
  }

  attack() {
    if (this.playerState === 'attack') return;

    this.changeState('attack');

    // 기존 hitbox 제거
    if (this.currentHitbox) {
      this.currentHitbox.destroy();
      this.currentHitbox = null;
      if (this.hitboxTimer) {
        this.hitboxTimer.remove(false);
        this.hitboxTimer = null;
      }
    }

    // 히트박스 생성
    const width = 10; // 가로 폭을 좁게
    const height = 50; // 세로를 길게
    const offsetX = this.sprite.flipX ? -5 : 5; // 플레이어 몸 가까이
    const offsetY = -20; // 플레이어 몸 위쪽으로 올림

    const hitbox = this.scene.add.rectangle(
      this.sprite.x + offsetX,
      this.sprite.y + offsetY,
      width,
      height,
      0xff0000,
      0.3,
    );
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    // enemy와 충돌 처리
    this.scene.enemyManager?.enemies.forEach((enemy) => {
      this.scene.physics.add.overlap(hitbox, enemy.sprite, () => {
        enemy.takeDamage();
      });
    });

    this.currentHitbox = hitbox;

    // 일정 시간 후 hitbox 제거
    this.hitboxTimer = this.scene.time.addEvent({
      delay: 100, // 0.3초
      callback: () => {
        if (this.currentHitbox) {
          this.currentHitbox.destroy();
          this.currentHitbox = null;
          this.hitboxTimer = null;
        }
      },
    });
  }

  update() {
    const speed = 100 * this.mapScale;
    const cursors = this.scene.cursors;
    const attackKey = this.scene.attackKey;
    const jumpKey = this.scene.jumpKey;

    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;
    if (onGround && this.isJumping) {
      this.isJumping = false;
      if (this.playerState === 'jump') this.changeState('idle');
    }

    // 좌우 이동
    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
      if (!this.isJumping && this.playerState !== 'attack') this.changeState('walk');
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
      if (!this.isJumping && this.playerState !== 'attack') this.changeState('walk');
    } else {
      this.sprite.setVelocityX(0);
      if (!this.isJumping && this.playerState !== 'attack') this.changeState('idle');
    }

    if (Phaser.Input.Keyboard.JustDown(jumpKey)) this.jump();
    if (Phaser.Input.Keyboard.JustDown(attackKey) && !this.isJumping) this.changeState('attack');

    // hitbox가 활성화돼 있으면 항상 플레이어 위치에 맞춤
  }
}
