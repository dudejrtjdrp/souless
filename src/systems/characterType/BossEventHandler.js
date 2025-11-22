import JobUnlockManager from './JobUnlockManager.js';
import { PortalConditionManager } from '../PortalConditionManager.js';

export default class BossEventHandler {
  constructor(scene) {
    this.scene = scene;
    this.isSlowMotionActive = false;
  }

  setupBossEvents() {
    this.scene.events.on('bossDefeated', (bossType) => this.onBossDefeated(bossType));
    this.scene.events.on('job-condition-completed', (jobKey) =>
      this.onJobConditionCompleted(jobKey),
    );
  }

  startSlowMotion(duration = 1500) {
    if (this.isSlowMotionActive) return;
    this.isSlowMotionActive = true;

    this.scene.time.timeScale = 0.3;

    this.scene.time.delayedCall(duration / 0.3, () => {
      this.scene.time.timeScale = 1;
      this.isSlowMotionActive = false;
    });
  }

  async onBossDefeated(bossType) {
    // ✅ semi_boss는 무시 (안전장치)
    if (bossType === 'semi_boss') {
      console.log('Semi boss event received but ignored');
      return;
    }

    const jobKey = JobUnlockManager.getJobKeyFromBoss(bossType);

    this.startSlowMotion(1500);
    this.showBossClearEffect(bossType);

    if (jobKey) {
      const unlocked = await JobUnlockManager.unlockCharacter(jobKey);
      if (this.scene.player?.sprite) {
        this.scene.player.sprite.setVelocityX(0);
        this.scene.player.sprite.setVelocityY(0);
        this.scene.player.sprite.body.setAllowGravity(false);
      }
      if (unlocked) {
        this.scene.time.delayedCall(1500, async () => {
          this.showJobUnlockEffect(jobKey);

          await PortalConditionManager.recordBossDefeat(bossType);

          this.scene.time.delayedCall(1000, () => {
            this.scene.scene.start('GameScene', {
              characterType: jobKey,
              skipSaveCheck: true,
              showJobUnlock: jobKey,
            });
          });
        });

        return;
      }
    }

    this.scene.time.delayedCall(1500, () => {
      if (this.scene.enemyManager) {
        this.scene.enemyManager.resumeSpawning();
      }
      this.scene.currentBoss = null;
    });
  }

  showBossClearEffect(bossType) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const clearText = this.scene.add
      .text(centerX, centerY - 80, `${bossType.toUpperCase()}`, {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    const clearLabelText = this.scene.add
      .text(centerX, centerY + 20, 'CLEAR!', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ff6b6b',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setScale(0);

    this.scene.tweens.add({
      targets: clearLabelText,
      scale: 1.3,
      duration: 400,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: clearLabelText,
      rotation: Math.PI * 2,
      duration: 1200,
      ease: 'Linear',
    });

    this.scene.tweens.add({
      targets: [clearText, clearLabelText],
      alpha: 0,
      y: centerY - 150,
      duration: 800,
      delay: 1200,
      ease: 'Power2',
      onComplete: () => {
        clearText.destroy();
        clearLabelText.destroy();
      },
    });
  }

  async onJobConditionCompleted(jobKey) {
    await JobUnlockManager.addAvailableBoss(jobKey);
    this.showConditionMetNotification(jobKey);
  }

  showConditionMetNotification(jobKey) {
    // 필요시 구현
  }

  showJobUnlockEffect(jobKey) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const unlockText = this.scene.add
      .text(centerX, centerY, `${jobKey.toUpperCase()} UNLOCKED!`, {
        fontSize: '56px',
        fontFamily: 'Arial Black',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setScale(0.5)
      .setAlpha(0);

    this.scene.cameras.main.flash(800, 255, 215, 0);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      delay: 1700,
      ease: 'Power2',
      onComplete: () => unlockText.destroy(),
    });
  }

  showJobUnlockOnSceneStart(jobKey) {
    if (!jobKey) return;

    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const unlockText = this.scene.add
      .text(centerX, centerY, `${jobKey.toUpperCase()} UNLOCKED!`, {
        fontSize: '56px',
        fontFamily: 'Arial Black',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setScale(0.5)
      .setAlpha(0);

    this.scene.cameras.main.flash(800, 255, 215, 0);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      delay: 2200,
      ease: 'Power2',
      onComplete: () => unlockText.destroy(),
    });
  }

  destroy() {
    if (this.isSlowMotionActive) {
      this.scene.time.timeScale = 1;
    }
    this.scene.events.off('bossDefeated');
    this.scene.events.off('job-condition-completed');
  }
}
