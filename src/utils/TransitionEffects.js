/**
 * TransitionEffects.js
 * 모든 트랜지션 및 애니메이션 효과를 관리하는 클래스
 */

export default class TransitionEffects {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * VHS 글리치 효과 (기본)
   * @param {number} duration - 효과 지속 시간 (ms)
   */
  playVHSGlitch(duration = 2000) {
    const camera = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    const startTime = this.scene.time.now;

    const vhsLines = this.scene.add.graphics().setDepth(50000).setScrollFactor(0);

    const glitchOverlay = this.scene.add
      .rectangle(camera.centerX, camera.centerY, canvas.width * 2, canvas.height * 2, 0xff0000, 0.1)
      .setOrigin(0.5)
      .setDepth(49999)
      .setScrollFactor(0);

    const glitchTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.scene.time.now - startTime > duration) {
          glitchTimer.remove();
          vhsLines.destroy();
          glitchOverlay.destroy();
          return;
        }

        const offsetX = Phaser.Math.Between(-15, 15);
        const offsetY = Phaser.Math.Between(-10, 10);
        camera.setScroll(camera.scrollX + offsetX, camera.scrollY + offsetY);

        vhsLines.clear();
        vhsLines.fillStyle(0x000000, 0.3);

        for (let i = 0; i < 10; i++) {
          const lineY = Phaser.Math.Between(0, canvas.height);
          const lineHeight = Phaser.Math.Between(1, 3);
          vhsLines.fillRect(0, lineY, canvas.width * 2, lineHeight);
        }

        const glitchColor = Phaser.Math.RandRange(0, 1) > 0.5 ? 0xff0000 : 0x00ff00;
        glitchOverlay.setFillStyle(glitchColor, Phaser.Math.RandRange(0.05, 0.15));

        if (Phaser.Math.RandRange(0, 1) > 0.7) {
          camera.flash(100, 255, 255, 255, false, 0.3);
        }
      },
      repeat: Math.floor(duration / 50),
    });

    this.scene.time.delayedCall(duration, () => {
      camera.setScroll(camera.scrollX, camera.scrollY);
      vhsLines.destroy();
      glitchOverlay.destroy();
    });
  }

  /**
   * VHS 글리치 효과 (강렬함)
   * @param {number} duration - 효과 지속 시간 (ms)
   */
  playVHSGlitchIntense(duration = 2000) {
    const camera = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    const startTime = this.scene.time.now;

    const noiseGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false }, false);
    noiseGraphics.setDepth(50000).setScrollFactor(0);

    const redOverlay = this.scene.add
      .rectangle(camera.centerX, camera.centerY, canvas.width * 3, canvas.height * 3, 0xff0000, 0)
      .setOrigin(0.5)
      .setDepth(49998)
      .setScrollFactor(0);

    const blueOverlay = this.scene.add
      .rectangle(camera.centerX, camera.centerY, canvas.width * 3, canvas.height * 3, 0x0000ff, 0)
      .setOrigin(0.5)
      .setDepth(49997)
      .setScrollFactor(0);

    const glitchTimer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (this.scene.time.now - startTime > duration) {
          glitchTimer.remove();
          noiseGraphics.destroy();
          redOverlay.destroy();
          blueOverlay.destroy();
          camera.setScroll(camera.scrollX, camera.scrollY);
          return;
        }

        const offsetX = Phaser.Math.Between(-25, 25);
        const offsetY = Phaser.Math.Between(-20, 20);
        camera.setScroll(camera.scrollX + offsetX, camera.scrollY + offsetY);

        noiseGraphics.clear();
        noiseGraphics.fillStyle(0x000000, 0.4);

        for (let i = 0; i < 15; i++) {
          const y = Phaser.Math.Between(0, canvas.height);
          const height = Phaser.Math.Between(2, 6);
          noiseGraphics.fillRect(0, y, canvas.width * 3, height);
        }

        const intensity = Math.abs(Math.sin(this.scene.time.now / 100)) * 0.3;
        redOverlay.setAlpha(intensity * 0.8);
        blueOverlay.setAlpha(intensity * 0.5);

        if (Phaser.Math.RandRange(0, 1) > 0.6) {
          camera.flash(50, 255, 100, 100, false, 0.5);
        }

        if (Phaser.Math.RandRange(0, 1) > 0.75) {
          const scanX = Phaser.Math.Between(-50, 50);
          noiseGraphics.fillStyle(0xffffff, 0.2);
          noiseGraphics.fillRect(scanX, 0, canvas.width, canvas.height * 3);
        }
      },
      repeat: Math.floor(duration / 30),
    });

    this.scene.time.delayedCall(duration, () => {
      camera.setScroll(camera.scrollX, camera.scrollY);
      noiseGraphics.destroy();
      redOverlay.destroy();
      blueOverlay.destroy();
    });
  }

  /**
   * 글리치 효과 (보스 페이즈 전환용)
   */
  playGlitchEffect(duration = 800) {
    const camera = this.scene.cameras.main;
    const glitchDuration = duration;
    const glitchIntensity = 12;
    const startTime = this.scene.time.now;

    this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.scene.time.now - startTime > glitchDuration) {
          return;
        }

        const offsetX = Phaser.Math.Between(-glitchIntensity, glitchIntensity);
        const offsetY = Phaser.Math.Between(-glitchIntensity, glitchIntensity);
        camera.setScroll(camera.scrollX + offsetX, camera.scrollY + offsetY);
      },
      repeat: Math.floor(glitchDuration / 50),
    });

    camera.flash(200, 100, 150, 255);
    this.scene.time.delayedCall(300, () => camera.flash(200, 100, 150, 255));
    this.scene.time.delayedCall(600, () => camera.flash(200, 100, 150, 255));
  }

  /**
   * 최종 보스 각성 메시지
   */
  async showFinalBossAwakeningMessage() {
    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    const darkOverlay = this.scene.add
      .rectangle(centerX, centerY, camera.width * 2, camera.height * 2, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(9999)
      .setScrollFactor(0)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: darkOverlay,
      alpha: 0.7,
      duration: 800,
    });

    const messageText = this.scene.add
      .text(centerX, centerY - 100, '봉인되었던 힘이 깨어난다...', {
        fontSize: '40px',
        fontFamily: 'Arial',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: messageText,
      alpha: 1,
      duration: 600,
      ease: 'Power2.easeIn',
    });

    const subText = this.scene.add
      .text(centerX, centerY + 50, '최종 보스가 각성했다!', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: subText,
      alpha: 1,
      duration: 600,
      delay: 400,
      ease: 'Power2.easeIn',
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: [darkOverlay, messageText, subText],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          darkOverlay.destroy();
          messageText.destroy();
          subText.destroy();
        },
      });
    });
  }

  /**
   * Phase 2 등장 애니메이션
   */
  playPhase2Entrance() {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const phase2Text = this.scene.add
      .text(centerX, centerY - 100, 'PHASE 2', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.5);

    this.scene.tweens.add({
      targets: phase2Text,
      alpha: 1,
      scale: 1.3,
      duration: 500,
      ease: 'Back.easeOut',
    });

    const descText = this.scene.add
      .text(centerX, centerY + 50, '보스가 완전한 힘을 드러낸다!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#FFAA00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: descText,
      alpha: 1,
      duration: 400,
      delay: 200,
    });

    if (this.scene.currentBoss?.sprite) {
      const particles = this.scene.add.particles(
        this.scene.currentBoss.sprite.x,
        this.scene.currentBoss.sprite.y,
        'particle',
        {
          speed: { min: 150, max: 300 },
          scale: { start: 1.5, end: 0 },
          lifespan: 1200,
          quantity: 50,
          blendMode: 'ADD',
          tint: [0xff0000, 0xff6600, 0xffaa00],
        },
      );

      this.scene.time.delayedCall(1200, () => particles.destroy());

      this.scene.tweens.add({
        targets: this.scene.currentBoss.sprite,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 6,
      });
    }

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [phase2Text, descText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          phase2Text.destroy();
          descText.destroy();
        },
      });
    });
  }

  /**
   * 레벨업 효과
   */
  playLevelUpEffect(level) {
    // ✅ level이 undefined인 경우 기본값 설정
    if (!level || typeof level !== 'number') {
      level = 1;
    }

    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const levelUpText = this.scene.add
      .text(centerX, centerY - 50, `LEVEL UP! ${level}`, {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.scene.cameras.main.flash(500, 255, 215, 0);

    this.scene.tweens.add({
      targets: levelUpText,
      alpha: 0,
      y: centerY - 100,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy(),
    });

    if (this.scene.player?.sprite) {
      const particles = this.scene.add.particles(
        this.scene.player.sprite.x,
        this.scene.player.sprite.y,
        'particle',
        {
          speed: { min: 100, max: 200 },
          scale: { start: 1, end: 0 },
          lifespan: 1000,
          quantity: 20,
          blendMode: 'ADD',
        },
      );
      this.scene.time.delayedCall(1000, () => particles.destroy());
    }
  }

  /**
   * 보스 등장 애니메이션
   */
  playBossEntrance(bossType) {
    this.scene.cameras.main.shake(500, 0.01);

    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const warningText = this.scene.add
      .text(centerX, centerY - 100, '⚠️ BOSS APPEARED ⚠️', {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: warningText,
      alpha: 0,
      y: centerY - 150,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => warningText.destroy(),
    });

    const bossNameText = this.scene.add
      .text(centerX, centerY, bossType.toUpperCase(), {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: bossNameText,
      alpha: 0,
      y: centerY + 50,
      duration: 2500,
      delay: 500,
      ease: 'Power2',
      onComplete: () => bossNameText.destroy(),
    });
  }

  /**
   * 게임오버 효과
   */
  async playDeathEffect() {
    const camera = this.scene.cameras.main;
    camera.shake(300, 0.05);
    await this.delay(300);
    camera.fadeOut(800, 0, 0, 0);
    await this.delay(800);
  }

  /**
   * 헬퍼: 딜레이
   */
  delay(ms) {
    return new Promise((resolve) => this.scene.time.delayedCall(ms, resolve));
  }
}
