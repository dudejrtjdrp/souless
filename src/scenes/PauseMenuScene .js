import Phaser from 'phaser';

export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super('PauseMenuScene');
  }

  init(data) {
    this.callingScene = data.callingScene || 'GameScene';
  }

  create() {
    const { width, height } = this.cameras.main;

    // 반투명 배경
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setScrollFactor(0)
      .setDepth(1000);

    // 메뉴 패널
    const panelWidth = 400;
    const panelHeight = 500;
    const panelX = width / 2;
    const panelY = height / 2;

    // 패널 배경
    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(4, 0x16213e)
      .setScrollFactor(0)
      .setDepth(1001);

    // 제목
    this.add
      .text(panelX, panelY - 180, 'PAUSED', {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

    // 메뉴 버튼들
    this.menuItems = [
      { text: 'Resume', action: () => this.resumeGame() },
      { text: 'Main Menu', action: () => this.returnToMainMenu() },
    ];

    this.selectedIndex = 0;
    this.buttons = [];

    this.menuItems.forEach((item, index) => {
      const buttonY = panelY - 60 + index * 100;

      // 버튼 배경
      const buttonBg = this.add
        .rectangle(panelX, buttonY, 320, 70, 0x0f3460)
        .setStrokeStyle(3, 0x16213e)
        .setScrollFactor(0)
        .setDepth(1002)
        .setInteractive({ useHandCursor: true });

      // 버튼 텍스트
      const buttonText = this.add
        .text(panelX, buttonY, item.text, {
          fontSize: '32px',
          fontFamily: 'Arial',
          color: '#e94560',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1003);

      // 마우스 이벤트
      buttonBg.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      buttonBg.on('pointerdown', () => {
        item.action();
      });

      this.buttons.push({ bg: buttonBg, text: buttonText });
    });

    // 선택 인디케이터
    this.selector = this.add
      .text(panelX - 180, 0, '▶', {
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1003);

    this.updateSelection();

    // 키보드 입력
    this.setupKeyboard();

    // 안내 텍스트
    this.add
      .text(panelX, panelY + 200, 'Press ESC to Resume', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      this.selectCurrentItem();
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      this.selectCurrentItem();
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.resumeGame();
    });
  }

  updateSelection() {
    this.buttons.forEach((button, index) => {
      if (index === this.selectedIndex) {
        // 선택된 버튼
        button.bg.setFillStyle(0x16213e);
        button.bg.setStrokeStyle(4, 0xe94560);
        button.text.setColor('#ffffff');

        // 선택자 위치 업데이트
        this.selector.setY(button.bg.y);
      } else {
        // 선택되지 않은 버튼
        button.bg.setFillStyle(0x0f3460);
        button.bg.setStrokeStyle(3, 0x16213e);
        button.text.setColor('#e94560');
      }
    });
  }

  selectCurrentItem() {
    this.menuItems[this.selectedIndex].action();
  }

  resumeGame() {
    // 일시정지 해제
    this.scene.resume(this.callingScene);

    // 이 씬 종료
    this.scene.stop();
  }

  async returnToMainMenu() {
    const gameScene = this.scene.get(this.callingScene);

    if (gameScene) {
      // 게임 상태 저장
      await gameScene.saveCurrentPosition();
      await gameScene.saveCurrentCharacterResources();

      // UI Scene 정리
      if (gameScene.uiScene) {
        this.scene.stop('UIScene');
      }

      // 게임 씬 정리
      gameScene.cleanupBeforeTransition();
      this.scene.stop(this.callingScene);
    }

    // 이 씬도 종료
    this.scene.stop();

    // 메인 메뉴로 이동
    this.scene.start('MainMenuScene');
  }
}
