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
    this.tutorialContainer = null; // 컨테이너로 모든 요소를 그룹화
    this.currentTimeout = null;
    this.arrowContainer = null; // 화살표 컨테이너
  }

  /**
   * 튜토리얼 시작
   */
  start() {
    if (this.tutorialActive) return;

    this.tutorialActive = true;
    this.currentStep = 0;
    this.completedSteps.clear();

    console.log('📚 튜토리얼 시작');

    // 키보드 입력 설정 (ENTER로 다음 단계)
    this.setupInput();

    this.showStep(0);
  }

  /**
   * 키보드 입력 설정
   */
  setupInput() {
    this.scene.input.keyboard.on('keydown-ENTER', () => {
      if (this.tutorialActive) {
        console.log('⏭️ 튜토리얼 단계 진행');
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

    // 키보드 리스너 제거
    this.scene.input.keyboard.off('keydown-ENTER');

    console.log('✅ 튜토리얼 완료');

    // 튜토리얼 완료 후 화살표 표시
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
        description: '` (백틱) 키를 길게 누르면 육체를 변환할 수 있습니다!',
        duration: 5000,
      },
      {
        title: '⚔️ 공격',
        description: 'A 키를 눌러 공격합니다!',
        duration: 5000,
      },
      {
        title: '✨ 스킬 시스템',
        description:
          '현재 Soul 육체에는 스킬을 사용할 수 없습니다.\n새로운 육체를 획득하면 Q, W, E, R 스킬을 사용할 수 있습니다!\n\n스킬은 10레벨당 하나씩 해방됩니다:\n Lv10: Q 스킬 해방\n Lv20: W 스킬 해방\n Lv30: E 스킬 해방\n Lv40: R 스킬 해방',
        duration: 8000,
        isLong: true,
      },
      {
        title: '✨ 준비 완료!',
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

    // 자동으로 다음 단계로 진행
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
    // 이전 요소 완전히 제거
    this.destroyAllUIElements();

    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    // ✅ 컨테이너 생성 (모든 튜토리얼 요소를 한곳에)
    this.tutorialContainer = this.scene.add.container(0, 0);
    this.tutorialContainer.setDepth(9998);
    this.tutorialContainer.setScrollFactor(0);

    // 배경 오버레이
    const overlay = this.scene.add
      .rectangle(centerX, centerY, camera.width * 2, camera.height * 2, 0x000000, 0.3)
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 튜토리얼 박스 배경 (긴 설명용 높이 증가)
    const boxWidth = step.isLong ? 600 : 500;
    const boxHeight = step.isLong ? 420 : 220;
    const boxX = centerX;
    const boxY = centerY - (step.isLong ? 50 : 100);

    const box = this.scene.add
      .rectangle(boxX, boxY, boxWidth, boxHeight, 0x1a1a2e, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x00d4ff, 1)
      .setScrollFactor(0);

    // 제목
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

    // 설명
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

    // ✅ ENTER 안내 텍스트
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

    // 진행 바
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

    // 단계 텍스트
    const stepText = this.scene.add
      .text(boxX, progressBarY + 30, `${currentStep + 1} / ${totalSteps}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 컨테이너에 모든 요소 추가
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

    // depth 설정
    this.tutorialContainer.setDepth(9998);
  }

  /**
   * 완료 후 방향 화살표 표시
   */
  showDirectionArrow() {
    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    // 화살표 컨테이너
    this.arrowContainer = this.scene.add.container(0, 0);
    this.arrowContainer.setDepth(9999);
    this.arrowContainer.setScrollFactor(0);

    // 반투명 배경
    const arrowBg = this.scene.add
      .rectangle(centerX, centerY, 200, 120, 0x000000, 0)
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 화살표 텍스트 (큼)
    const arrow = this.scene.add
      .text(centerX, centerY - 20, '➜', {
        fontSize: '80px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 안내 텍스트
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

    // 화살표 깜빡이는 애니메이션
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
      this.tutorialContainer.destroy(true); // true: 자식 요소도 함께 삭제
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
    console.log('⏭️ 튜토리얼 전체 스킵');
    this.end();
  }
}
