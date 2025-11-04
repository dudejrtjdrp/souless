import Phaser from 'phaser';

export default class Soul {
  constructor(scene, x, y, scale = 1, mapScale = 1) {
    this.scene = scene;
    this.mapScale = mapScale;
    this.sprite = scene.physics.add.sprite(x, y, 'soul').setScale(scale);
    this.sprite.setDepth(100);
    this.sprite.setCollideWorldBounds(true);

    this.playerState = 'idle';
    this.isJumping = false;
    this.jumpHeight = 100;
    this.jumpDuration = 500;
    this.absorbKeyDownTime = 0;
    this.isClimbing = false; // 🔹 경사 오르는 중 플래그

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
        this.sprite.once('animationcomplete-attack', () => {
          if (this.playerState === 'attack') this.changeState('idle');
        });
        break;
    }
  }

  jump() {
    // 🔹 바닥에 있을 때만 점프 (Tween 대신 velocity 사용)
    if (this.isJumping) return;

    this.isJumping = true;
    this.changeState('jump');

    // 🔹 물리 기반 점프
    this.sprite.body.setVelocityY(-500);

    this.isJumping = false;
    if (this.bodyIsMoving()) this.changeState('walk');
    else this.changeState('idle');
  }

  bodyIsMoving() {
    const cursors = this.scene.cursors;
    return cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown;
  }

  update(time, delta) {
    const body = this.sprite.body;
    body.setVelocityX(0);
    let moving = false;

    const cursors = this.scene.cursors;
    const attackKey = this.scene.attackKey;
    const jumpKey = this.scene.jumpKey;

    if (Phaser.Input.Keyboard.JustDown(attackKey)) {
      if (this.playerState !== 'attack') this.changeState('attack');
    } else if (Phaser.Input.Keyboard.JustDown(jumpKey) && this.playerState !== 'attack') {
      this.jump();
    }

    if (cursors.left.isDown) {
      body.setVelocityX(-200);
      this.sprite.setFlipX(true);
      moving = true;

      // 🔹 바닥에 있을 때만 경사 처리
      if (body.touching.down) {
        this.handleSlope(-1);
        this.adjustToTerrain(-1);
      }
    } else if (cursors.right.isDown) {
      body.setVelocityX(200);
      this.sprite.setFlipX(false);
      moving = true;

      // 🔹 바닥에 있을 때만 경사 처리
      if (body.touching.down) {
        this.handleSlope(1);
        this.adjustToTerrain(1);
      }
    }

    if (!this.isJumping && this.playerState !== 'attack') {
      if (moving) this.changeState('walk');
      else this.changeState('idle');
    }

    if (attackKey.isDown) this.absorbKeyDownTime += delta;
    else this.absorbKeyDownTime = 0;
  }

  adjustToTerrain(direction) {
    const body = this.sprite.body;
    if (!body.touching.down) return;

    const stepHeight = 8; // 한번에 올라갈 최대 높이
    const lookAhead = 10; // 앞으로 체크할 거리

    const nextX = Math.floor(this.sprite.x + direction * lookAhead);
    for (let i = 0; i <= stepHeight; i++) {
      const pixelIndex =
        (Math.floor(this.sprite.y + body.halfHeight - i) * this.scene.collisionWidth + nextX) * 4;
      const alpha = this.scene.collisionData.data[pixelIndex + 3];
      if (alpha > 128) {
        this.sprite.y -= i; // 자연스럽게 올리기
        break;
      }
    }
  }

  handleSlope(direction) {
    const body = this.sprite.body;
    if (!body.touching.down) return;

    const stepHeight = 20 * this.mapScale;
    const lookAhead = 12 * this.mapScale; // 더 짧게

    if (body.blocked.right || body.blocked.left) {
      const terrainHeight = this.getTerrainHeightAhead(direction, lookAhead);

      if (terrainHeight > 0 && terrainHeight <= stepHeight) {
        // 🔹 약하게 올라가기
        const upwardForce = terrainHeight * 10;
        body.setVelocityY(-Math.min(upwardForce, 250));
      }
    }
  }

  getTerrainHeightAhead(direction, distance) {
    const collisionData = this.scene.collisionData;
    if (!collisionData) return 0;

    const body = this.sprite.body;

    // 🔹 월드 좌표를 원본 이미지 좌표로 변환
    const checkX = Math.floor((this.sprite.x + direction * distance) / this.mapScale);
    const currentY = Math.floor((this.sprite.y + body.halfHeight) / this.mapScale);

    let height = 0;
    const maxCheck = 40;

    for (let i = 0; i < maxCheck; i++) {
      const checkY = currentY - i;

      if (
        checkX < 0 ||
        checkX >= this.scene.collisionWidth ||
        checkY < 0 ||
        checkY >= this.scene.collisionHeight
      ) {
        break;
      }

      const pixelIndex = (checkY * this.scene.collisionWidth + checkX) * 4;
      const alpha = collisionData.data[pixelIndex + 3];

      if (alpha > 128) {
        height = i;
      } else {
        break;
      }
    }

    // 🔹 반환 높이도 스케일 적용
    return height * this.mapScale;
  }

  canStepUp(direction, maxHeight) {
    // 간단한 체크: 너무 높이 올라가지 않았는지 확인
    // 실제 구현에서는 앞쪽 지형의 높이를 정확히 측정해야 함
    const body = this.sprite.body;

    // 여기에 실제 지형 높이 체크 로직 추가 가능
    // 지금은 간단하게 최대 높이만 제한
    return true; // 일단 항상 올라갈 수 있도록
  }
}
