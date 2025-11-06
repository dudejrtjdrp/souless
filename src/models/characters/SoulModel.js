import Phaser from 'phaser';
import GameState from '../GameState.js';

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

    // 점프 관련
    this.jumpCount = 0;
    this.maxJump = 2;

    // 공격용 hitbox
    this.attackHitbox = scene.add.rectangle(x, y, 40, 30, 0xff0000, 0.3);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.body.setAllowGravity(false);

    // 🔹 한 번의 공격에서 한 명만 맞도록 플래그
    this.hasDealtDamageThisAttack = false;

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
        this.activateHitbox();
        this.sprite.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changeState('idle');
        });
        break;
    }
  }

  activateHitbox() {
    // 🔹 새 공격 시작 시 플래그 초기화
    this.hasDealtDamageThisAttack = false;

    // hitbox 활성화
    this.attackHitbox.body.enable = true;

    // 위치를 공격 방향으로 맞춤
    const offsetX = this.sprite.flipX ? -30 : 30;
    this.attackHitbox.x = this.sprite.x + offsetX;
    this.attackHitbox.y = this.sprite.y;

    // 0.5초 후 hitbox 비활성화
    this.scene.time.delayedCall(500, () => {
      this.attackHitbox.body.enable = false;
    });
  }

  jump() {
    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;

    if (onGround) {
      this.jumpCount = 0;
    }

    if (this.jumpCount < this.maxJump) {
      this.sprite.setVelocityY(-130 * this.mapScale);
      this.changeState('jump');
      this.jumpCount++;
    }
  }

  attack() {
    if (this.playerState === 'attack') return;
    this.changeState('attack');
  }

  // 🔹 EnemyManager에서 호출할 메서드
  checkAttackHit(enemy) {
    // 이미 이번 공격에서 데미지를 줬으면 무시
    if (this.hasDealtDamageThisAttack) return false;

    // hitbox가 비활성화되어 있으면 무시
    if (!this.attackHitbox.body.enable) return false;

    // hitbox와 적 충돌 확인
    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.attackHitbox.getBounds(),
        enemy.sprite.getBounds(),
      )
    ) {
      // 🔹 이번 공격에서 데미지를 줬다고 표시
      this.hasDealtDamageThisAttack = true;
      console.log(`[Soul] 🎯 Hit enemy!`);
      return true;
    }

    return false;
  }

  // 🔹 공격이 끝났는지 확인
  isAttacking() {
    return this.playerState === 'attack' && this.attackHitbox.body.enable;
  }

  update() {
    const speed = 100 * this.mapScale;
    const cursors = this.scene.cursors;
    const attackKey = this.scene.attackKey;
    const jumpKey = this.scene.jumpKey;

    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;
    if (onGround) {
      this.jumpCount = 0;
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

    // 점프 입력 처리
    if (Phaser.Input.Keyboard.JustDown(jumpKey)) this.jump();

    // 공격 입력 처리
    if (Phaser.Input.Keyboard.JustDown(attackKey) && !this.isJumping) this.attack();
  }
}
