/**
 * 튜토리얼 시스템
 * other_cave에서 게임 시작 시 조작법을 가르침
 */
export default class TutorialSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentStep = 0;
    this.tutorialActive = false;
    this.completedSteps = new Set();
    this.tutorialContainer = null;
    this.currentTimeout = null;
    this.arrowContainer = null;
  }

  /**
   * 튜토리얼 시작
   */
  start() {
    if (this.tutorialActive) return;

    this.tutorialActive = true;
    this.currentStep = 0;
    this.completedSteps.clear();

    this.setupInput();
    this.showStep(0);
  }

  /**
   * 키보드 입력 설정
   */
  setupInput() {
    this.scene.input.keyboard.on('keydown-ENTER', () => {
      if (this.tutorialActive) {
        this.skipToNextStep();
      }
    });
  }

  /**
   * 다음 단계로 건너뛰기
   */
  skipToNextStep() {
    if (this.currentTimeout) {
      this.scene.time.removeEvent(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.destroyAllUIElements();
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  /**
   * 튜토리얼 종료
   */
  end() {
    this.tutorialActive = false;
    this.destroyAllUIElements();

    if (this.currentTimeout) {
      this.scene.time.removeEvent(this.currentTimeout);
      this.currentTimeout = null;
    }

    this.scene.input.keyboard.off('keydown-ENTER');

    this.showDirectionArrow();
  }

  /**
   * 튜토리얼 단계 표시
   */
  showStep(stepIndex) {
    const steps = [
      {
        title: '🎮 움직임',
        description: '← → 키로 좌우 이동하세요!',
        duration: 5000,
      },
      {
        title: '⬆️ 점프',
        description: 'SPACE바로 점프합니다!',
        duration: 5000,
      },
      {
        title: '💨 대시',
        description: 'S 키로 대시를 합니다!',
        duration: 5000,
      },
      {
        title: '🏃 달리기',
        description: 'SHIFT 키를 누르고 이동하여 빠르게 달립니다!',
        duration: 5000,
      },
      {
        title: '🔄 육체 변환',
        description:
          '` (백틱) 키를 누르면 캐릭터 선택창이 열립니다!\n\n← → 화살표로 원하는 캐릭터를 선택하고\nENTER 키를 눌러 변환하세요!\n\n⏱️ 캐릭터 변환 후 1.5초 쿨타임이 있습니다.',
        duration: 7000,
        isLong: true,
      },
      {
        title: '⚔️ 공격',
        description: 'A 키를 눌러 공격합니다!',
        duration: 5000,
      },
      {
        title: '스킬 시스템',
        description:
          '현재 Soul 육체에는 스킬을 사용할 수 없습니다.\n새로운 육체를 획득하면 Q, W, E, R 스킬을 사용할 수 있습니다!\n\n스킬은 10레벨당 하나씩 해방됩니다:\n Lv10: Q 스킬 해방\n Lv20: W 스킬 해방\n Lv30: E 스킬 해방\n Lv40: R 스킬 해방',
        duration: 8000,
        isLong: true,
      },
      {
        title: '준비 완료!',
        description: '이제 게임을 진행해보세요!',
        duration: 3000,
        isLast: true,
      },
    ];

    if (stepIndex >= steps.length) {
      this.end();
      return;
    }

    const step = steps[stepIndex];
    this.displayTutorialBox(step, stepIndex, steps.length);

    if (this.currentTimeout) {
      this.scene.time.removeEvent(this.currentTimeout);
    }

    this.currentTimeout = this.scene.time.delayedCall(step.duration, () => {
      if (this.tutorialActive) {
        this.destroyAllUIElements();
        this.showStep(stepIndex + 1);
      }
    });
  }

  /**
   * 튜토리얼 박스 표시
   */
  displayTutorialBox(step, currentStep, totalSteps) {
    this.destroyAllUIElements();

    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    this.tutorialContainer = this.scene.add.container(0, 0);
    this.tutorialContainer.setDepth(9998);
    this.tutorialContainer.setScrollFactor(0);

    const overlay = this.scene.add
      .rectangle(centerX, centerY, camera.width * 2, camera.height * 2, 0x000000, 0.3)
      .setOrigin(0.5)
      .setScrollFactor(0);

    const boxWidth = step.isLong ? 600 : 500;
    const boxHeight = step.isLong ? 450 : 220;
    const boxX = centerX;
    const boxY = centerY - (step.isLong ? 50 : 100);

    const box = this.scene.add
      .rectangle(boxX, boxY, boxWidth, boxHeight, 0x1a1a2e, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x00d4ff, 1)
      .setScrollFactor(0);

    const title = this.scene.add
      .text(boxX, boxY - boxHeight / 2 + 40, step.title, {
        fontSize: '36px',
        fontFamily: 'Arial Black',
        color: '#00d4ff',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const description = this.scene.add
      .text(boxX, boxY, step.description, {
        fontSize: step.isLong ? '16px' : '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: boxWidth - 60 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const enterText = this.scene.add
      .text(boxX, boxY + boxHeight / 2 - 40, '[ ENTER 키를 눌러 다음으로 진행 ]', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const progressBarWidth = 300;
    const progressBarX = boxX;
    const progressBarY = boxY + boxHeight / 2 - 10;

    const progressBarBg = this.scene.add
      .rectangle(progressBarX, progressBarY, progressBarWidth, 15, 0x444444, 1)
      .setOrigin(0.5)
      .setScrollFactor(0);

    const progressPercent = (currentStep + 1) / totalSteps;
    const progressBar = this.scene.add
      .rectangle(
        progressBarX - progressBarWidth / 2 + (progressBarWidth * progressPercent) / 2,
        progressBarY,
        progressBarWidth * progressPercent,
        15,
        0x00d4ff,
        1,
      )
      .setOrigin(0.5)
      .setScrollFactor(0);

    const stepText = this.scene.add
      .text(boxX, progressBarY + 30, `${currentStep + 1} / ${totalSteps}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.tutorialContainer.add([
      overlay,
      box,
      title,
      description,
      enterText,
      progressBarBg,
      progressBar,
      stepText,
    ]);

    this.tutorialContainer.setDepth(9998);
  }

  /**
   * 완료 후 방향 화살표 표시
   */
  showDirectionArrow() {
    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    this.arrowContainer = this.scene.add.container(0, 0);
    this.arrowContainer.setDepth(9999);
    this.arrowContainer.setScrollFactor(0);

    const arrowBg = this.scene.add
      .rectangle(centerX, centerY, 200, 120, 0x000000, 0)
      .setOrigin(0.5)
      .setScrollFactor(0);

    const arrow = this.scene.add
      .text(centerX, centerY - 20, '➜', {
        fontSize: '80px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const guideText = this.scene.add
      .text(centerX, centerY + 40, '오른쪽으로 이동하세요!', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.arrowContainer.add([arrowBg, arrow, guideText]);

    this.scene.tweens.add({
      targets: [arrow, guideText],
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      repeat: -1,
      yoyo: true,
    });
  }

  /**
   * 모든 UI 요소 제거
   */
  destroyAllUIElements() {
    if (this.tutorialContainer) {
      this.tutorialContainer.destroy(true);
      this.tutorialContainer = null;
    }
  }

  /**
   * 방향 화살표 제거
   */
  destroyArrow() {
    if (this.arrowContainer) {
      this.arrowContainer.destroy(true);
      this.arrowContainer = null;
    }
  }

  /**
   * 튜토리얼 강제 종료
   */
  skip() {
    this.end();
  }
}
