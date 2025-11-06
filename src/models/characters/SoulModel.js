import Phaser from 'phaser';
import GameState from '../GameState.js';

export default class Soul {
  constructor(scene, x, y, scale = 1, playerScale) {
    this.scene = scene;
    this.walkSpeed = 200;
    this.runSpeed = 350;
    this.moveSpeed = this.walkSpeed; // 기본 속도
    this.jumpPower = 300;

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

    this.baseY = y;
    this.walkTween = null;

    // 공격용 hitbox
    this.attackHitbox = scene.add.rectangle(x, y, 40, 30, 0xff0000, 0.3);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.body.setAllowGravity(false);

    this.hasDealtDamageThisAttack = false;

    this.createAnimations();
    this.changeState('idle');
  }

  createAnimations() {
    const anims = [
      { key: 'idle', start: 0, end: 1, frameRate: 3, repeat: -1 },
      { key: 'walk', start: 17, end: 19, frameRate: 6, repeat: -1 },
      { key: 'run', start: 25, end: 32, frameRate: 10, repeat: -1 }, // frameRate 증가
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
        if (this.sprite.anims.currentAnim?.key !== 'idle') {
          this.sprite.play('idle', true);
        }
        break;
      case 'walk':
        if (this.sprite.anims.currentAnim?.key !== 'walk') {
          this.sprite.play('walk', true);
        }
        break;
      case 'run':
        if (this.sprite.anims.currentAnim?.key !== 'run') {
          this.sprite.play('run', true);
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
        this.activateHitbox();
        this.sprite.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changeState('idle');
        });
        break;
    }
  }

  activateHitbox() {
    this.hasDealtDamageThisAttack = false;
    this.attackHitbox.body.enable = true;

    const offsetX = this.sprite.flipX ? -30 : 30;
    this.attackHitbox.x = this.sprite.x + offsetX;
    this.attackHitbox.y = this.sprite.y;

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
      this.sprite.setVelocityY(-this.jumpPower);
      this.changeState('jump');
      this.jumpCount++;
    }
  }

  attack() {
    if (this.playerState === 'attack') return;
    this.changeState('attack');
  }

  checkAttackHit(enemy) {
    if (this.hasDealtDamageThisAttack) return false;
    if (!this.attackHitbox.body.enable) return false;

    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.attackHitbox.getBounds(),
        enemy.sprite.getBounds(),
      )
    ) {
      this.hasDealtDamageThisAttack = true;
      return true;
    }

    return false;
  }

  isAttacking() {
    return this.playerState === 'attack' && this.attackHitbox.body.enable;
  }

  startWalkTween() {
    if (this.walkTween) return;

    this.walkTween = this.scene.tweens.add({
      targets: this.sprite,
      y: `+=1`,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopWalkTween() {
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
      this.sprite.y = this.baseY;
    }
  }

  update() {
    const cursors = this.scene.cursors;
    const attackKey = this.scene.attackKey;
    const jumpKey = this.scene.jumpKey;
    const runKey = this.scene.runKey;

    const onGround = this.sprite.body.touching.down || this.sprite.body.blocked.down;
    if (onGround) {
      this.jumpCount = 0;
      if (this.playerState === 'jump') this.changeState('idle');
    }

    // 점프 입력
    if (Phaser.Input.Keyboard.JustDown(jumpKey)) this.jump();

    // 공격 입력
    if (Phaser.Input.Keyboard.JustDown(attackKey)) this.attack();

    // 좌우 이동 처리
    const isMoving = cursors.left.isDown || cursors.right.isDown;
    const isRunning = runKey.isDown;

    if (cursors.left.isDown) {
      // 달리기 중이면 runSpeed, 아니면 walkSpeed
      this.moveSpeed = isRunning ? this.runSpeed : this.walkSpeed;
      this.sprite.setVelocityX(-this.moveSpeed);
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.moveSpeed = isRunning ? this.runSpeed : this.walkSpeed;
      this.sprite.setVelocityX(this.moveSpeed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // 상태 변경 (공격 중이 아닐 때만)
    if (this.playerState !== 'attack') {
      if (!onGround) {
        // 공중에 있으면 점프
        this.changeState('jump');
      } else if (isMoving) {
        // 움직이고 있으면
        if (isRunning) {
          this.changeState('run');
        } else {
          this.changeState('walk');
        }
      } else {
        // 아무것도 안 하면 idle
        this.changeState('idle');
      }
    }
  }
}
