import JobUnlockManager from './JobUnlockManager.js';
import { PortalConditionManager } from '../PortalConditionManager.js';

export default class BossEventHandler {
  constructor(scene) {
    this.scene = scene;
  }

  // 보스 이벤트 리스너 설정
  setupBossEvents() {
    // 보스 처치 이벤트
    this.scene.events.on('bossDefeated', (bossType) => this.onBossDefeated(bossType));

    // 전직 조건 완료 이벤트
    this.scene.events.on('job-condition-completed', (jobKey) =>
      this.onJobConditionCompleted(jobKey),
    );
  }

  // 보스 처치 시 처리
  async onBossDefeated(bossType) {
    const jobKey = JobUnlockManager.getJobKeyFromBoss(bossType);

    if (jobKey) {
      // 캐릭터 해금 (내부에서 availableBoss 제거 + clearedBosses 추가)
      const unlocked = await JobUnlockManager.unlockCharacter(jobKey);

      if (unlocked) {
        // 전직 완료 연출
        this.showJobUnlockEffect(jobKey);

        this.scene.events.on('bossDefeated', async (bossType) => {
          // 보스 처치 기록
          await PortalConditionManager.recordBossDefeat(bossType);
        });

        this.scene.scene.start('GameScene', {
          characterType: jobKey,
          skipSaveCheck: true,
        });
      }
    }

    // 일반 몬스터 스폰 재개
    if (this.scene.enemyManager) {
      this.scene.enemyManager.resumeSpawning();
    }

    this.scene.currentBoss = null;
  }

  // 전직 조건 완료 시 처리
  async onJobConditionCompleted(jobKey) {
    await JobUnlockManager.addAvailableBoss(jobKey);
    this.showConditionMetNotification(jobKey);
  }

  // 전직 조건 달성 알림 연출
  showConditionMetNotification(jobKey) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const notificationText = this.scene.add
      .text(centerX, centerY, `${jobKey.toUpperCase()} BOSS UNLOCKED!`, {
        fontSize: '32px',
        fontFamily: 'Arial Black',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: notificationText,
      alpha: 0,
      y: centerY - 50,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => notificationText.destroy(),
    });
  }

  // 캐릭터 해금 연출
  showJobUnlockEffect(jobKey) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    const unlockText = this.scene.add
      .text(centerX, centerY, `${jobKey.toUpperCase()} CLASS UNLOCKED!`, {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.scene.cameras.main.flash(1000, 255, 215, 0);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      scale: 1.5,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => unlockText.destroy(),
    });
  }

  // 이벤트 리스너 정리
  destroy() {
    this.scene.events.off('bossDefeated');
    this.scene.events.off('job-condition-completed');
  }
}
