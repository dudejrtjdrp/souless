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

  startSlowMotion(duration = 1000) {
    if (this.isSlowMotionActive) return;
    this.isSlowMotionActive = true;

    // 0.4 배율로 슬로우 모션
    this.scene.time.timeScale = 0.4;

    // duration 후 정상 속도 복귀 (씬 전환이 일어나지 않았을 경우를 대비한 안전장치)
    this.scene.time.delayedCall(duration / 0.4, () => {
      if (this.scene) {
        this.scene.time.timeScale = 1;
        this.isSlowMotionActive = false;
      }
    });
  }

  async onBossDefeated(bossType) {
    // semi_boss는 무시 (GameScene에서 별도 처리하거나 여기서 처리)
    if (bossType === 'semi_boss') {
      return;
    }

    const jobKey = JobUnlockManager.getJobKeyFromBoss(bossType);

    // 슬로우 모션 시작
    this.startSlowMotion(1000);
    this.showBossClearEffect(bossType);

    // 플레이어 움직임 봉인 (연출용)
    if (this.scene.player?.sprite) {
      this.scene.player.sprite.setVelocity(0, 0);
      this.scene.player.sprite.body.setAllowGravity(false);
      // 만약 플레이어 stateMachine이 있다면 idle로 고정
      if (this.scene.player.stateMachine) {
        this.scene.player.stateMachine.changeState('idle');
      }
    }

    if (jobKey) {
      const unlocked = await JobUnlockManager.unlockCharacter(jobKey);

      if (unlocked) {
        // 해금 연출 대기
        this.scene.time.delayedCall(800, async () => {
          this.showJobUnlockEffect(jobKey);
          await PortalConditionManager.recordBossDefeat(bossType);

          // 요청하신 대기 시간: 1200ms
          this.scene.time.delayedCall(1200, () => {
            this.transitionToNextScene(jobKey); // 씬 전환 함수 분리 호출
          });
        });
        return;
      }
    }

    // 해금이 없는 경우 (기존 보스 등)
    this.scene.time.delayedCall(1200, () => {
      // 씬 전환이 아니라면 게임 재개
      this.scene.time.timeScale = 1;
      this.isSlowMotionActive = false;

      if (this.scene.player?.sprite) {
        this.scene.player.sprite.body.setAllowGravity(true);
      }

      if (this.scene.enemyManager) {
        this.scene.enemyManager.resumeSpawning();
      }
      this.scene.currentBoss = null;
    });
  }

  // 씬 전환을 안전하게 처리하는 헬퍼 함수
  transitionToNextScene(jobKey) {
    // 1. 가장 중요: 시간 배율 정상화 (이게 안 되면 다음 씬 적/플레이어가 고장남)
    this.scene.time.timeScale = 1;
    this.isSlowMotionActive = false;

    // 2. 이벤트 리스너 정리 (중복 실행 방지)
    this.destroy();

    // 3. 씬 시작
    this.scene.scene.start('GameScene', {
      mapKey: this.scene.currentMapKey,
      characterType: jobKey,
      skipSaveCheck: true,
      showJobUnlock: jobKey,
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
      duration: 250,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: clearLabelText,
      rotation: Math.PI * 2,
      duration: 800,
      ease: 'Linear',
    });

    this.scene.tweens.add({
      targets: [clearText, clearLabelText],
      alpha: 0,
      y: centerY - 150,
      duration: 500,
      delay: 800,
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

    this.scene.cameras.main.flash(500, 255, 215, 0);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      delay: 1000,
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

    this.scene.cameras.main.flash(500, 255, 215, 0);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      delay: 1200,
      ease: 'Power2',
      onComplete: () => unlockText.destroy(),
    });
  }

  destroy() {
    // 안전장치: destroy 호출 시에도 시간 배율 복구
    if (this.scene) {
      this.scene.time.timeScale = 1;
    }
    this.isSlowMotionActive = false;
    this.scene.events.off('bossDefeated');
    this.scene.events.off('job-condition-completed');
  }
}
