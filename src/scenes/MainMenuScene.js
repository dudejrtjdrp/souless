import Phaser from 'phaser';
import SaveSlotManager from '../utils/SaveSlotManager.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.currentView = 'main'; // 'main', 'newGame', 'loadGame'
    this.selectedSlot = null; // SaveSlotManager에서 가져올 슬롯 요약 정보
    this.saveSlots = new Array(SaveSlotManager.MAX_SLOTS).fill(null);
  }

  preload() {
    // 배경 이미지 로드
    this.load.image('background', 'assets/mainmenu_background.png'); // 경로는 실제 png 위치로 변경
    this.load.image('title', 'assets/mainmenu_title.png'); // 실제 파일 경로로 변경
  }

  async create() {
    const { width, height } = this.cameras.main; // 배경 생성

    this.createBackground(width, height); // 세이브 데이터 로드 (SaveSlotManager 사용)

    await this.loadSaveSlots(); // 메인 메뉴 표시

    this.showMainMenu(); // 페이드인 효과

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  createBackground(width, height) {
    // PNG 배경 추가
    const bg = this.add.image(width / 2, height / 2, 'background');
    bg.setOrigin(0.5, 0.5);
    bg.setDisplaySize(width * 1.2, height * 1.2); // 화면 크기에 맞게 늘림

    // 원한다면 여전히 별 효과 추가 가능
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8);

      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.3,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }
  /**
   * 슬롯 요약 데이터가 실제로 비어있는지 (초기값인지) 확인
   * SaveManager.load()가 데이터가 없어도 기본 객체를 반환하므로, '실제 플레이 이력'을 기준으로 체크
   * @param {object | null} slotSummary - SaveSlotManager에서 로드된 슬롯 요약 데이터
   * @returns {boolean}
   */

  isSlotEmpty(slotSummary) {
    if (!slotSummary) return true;

    // SaveSlotManager의 isSlotReallyEmpty 사용
    return SaveSlotManager.isSlotReallyEmpty(slotSummary);
  }

  // 모든 슬롯의 요약 정보를 SaveSlotManager를 통해 로드하고 비어있는지 검사
  async loadSaveSlots() {
    try {
      this.saveSlots = await SaveSlotManager.loadAllSlots();
      console.log(this.saveSlots);
    } catch (error) {
      console.error('Error loading save slots:', error);
      this.saveSlots = new Array(SaveSlotManager.MAX_SLOTS).fill(null);
    }
  }

  /**
   * 게임 클리어 퍼센트를 계산
   * @param {object} slotSummary - 슬롯 요약 데이터
   * @returns {number} 클리어 퍼센트 (0-100)
   */
  calculateClearPercentage(slotSummary) {
    console.log(slotSummary);
    // final_boss를 잡았으면 무조건 100%
    if (slotSummary.clearedBosses && slotSummary.clearedBosses.includes('final_boss')) {
      return 100;
    }

    let totalPercentage = 0;

    // 1. 보스 처치 점수 (50%)
    const totalBosses = 8;
    const defeatedBosses = slotSummary.clearedBosses ? slotSummary.clearedBosses.length : 0;
    const bossPercentage = (defeatedBosses / totalBosses) * 50;
    totalPercentage += bossPercentage;

    // 2. 캐릭터 레벨 점수 (50%)
    const maxLevel = 40;
    const totalCharacters = 7;
    let totalLevelScore = 0;

    if (slotSummary.levelSystem && slotSummary.levelSystem.characterLevels) {
      const characterLevels = slotSummary.levelSystem.characterLevels;

      Object.keys(characterLevels).forEach((charType) => {
        const charLevel = characterLevels[charType].level || 0;
        const levelScore = Math.min(charLevel / maxLevel, 1); // 최대 1 (100%)
        totalLevelScore += levelScore;
      });

      // 전체 캐릭터 수로 나눠서 평균 구하기
      const avgLevelScore = totalLevelScore / totalCharacters;
      const levelPercentage = avgLevelScore * 50;
      totalPercentage += levelPercentage;
    }

    return Math.min(Math.round(totalPercentage), 100);
  }

  /**
   * 슬롯 요약 데이터를 기반으로 카드에 내용을 채웁니다.
   */

  populateSlotWithData(container, width, height, slotSummary) {
    // 저장 시간 포맷
    const date = new Date(slotSummary.timestamp);
    const dateString = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeString = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 현재 캐릭터 레벨 가져오기
    let currentLevel = 1;
    if (slotSummary.levelSystem && slotSummary.levelSystem.characterLevels) {
      const currentChar = slotSummary.currentCharacter || 'soul';
      if (slotSummary.levelSystem.characterLevels[currentChar]) {
        currentLevel = slotSummary.levelSystem.characterLevels[currentChar].level || 1;
      }
    }

    // level 정보 추가
    const content = [
      { key: 'Level:', value: `${currentLevel}` },
      {
        key: 'Character:',
        value: (slotSummary.currentCharacter || slotSummary.characterType || 'soul').toUpperCase(),
      },
      {
        key: 'Location:',
        value: slotSummary.mapKey || slotSummary.lastPosition?.mapKey || 'Unknown',
      },
      { key: 'Bosses:', value: `${(slotSummary.clearedBosses || []).length}/8` },
      { key: 'Last Save:', value: `${dateString} ${timeString}` },
    ];

    let yOffset = -height / 2 + 40;
    const padding = 15;

    content.forEach((item) => {
      const keyText = this.add
        .text(-width / 2 + padding, yOffset, item.key, {
          fontSize: '14px',
          fill: '#aaaaaa',
          fontFamily: 'monospace',
        })
        .setOrigin(0);

      const valueText = this.add
        .text(width / 2 - padding, yOffset, item.value, {
          fontSize: '14px',
          fill: '#ffffff',
          fontFamily: 'monospace',
          align: 'right',
        })
        .setOrigin(1, 0);

      container.add([keyText, valueText]);
      yOffset += 20;
    });

    // 클리어 퍼센트 계산
    const clearPercentage = this.calculateClearPercentage(slotSummary);

    // 하단에 클리어 퍼센트 표시
    yOffset += 5; // 약간의 간격

    const progressBarWidth = width - padding * 2;
    const progressBarHeight = 20;
    const progressBarY = height / 2 - 40;

    // 프로그레스 바 배경
    const progressBg = this.add.rectangle(
      0,
      progressBarY,
      progressBarWidth,
      progressBarHeight,
      0x1a1a2e,
      0.8,
    );
    progressBg.setStrokeStyle(2, 0x444466);

    // 프로그레스 바 채우기
    const fillWidth = (progressBarWidth - 4) * (clearPercentage / 100);
    const progressFill = this.add.rectangle(
      -progressBarWidth / 2 + 2 + fillWidth / 2,
      progressBarY,
      fillWidth,
      progressBarHeight - 4,
      clearPercentage >= 100 ? 0x00ff88 : 0x4a9eff,
      1,
    );

    // 퍼센트 텍스트
    const percentText = this.add
      .text(0, progressBarY, `${clearPercentage}%`, {
        fontSize: '14px',
        fontStyle: 'bold',
        fontFamily: 'monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    container.add([progressBg, progressFill, percentText]);

    // 100% 달성 시 CLEAR 표시
    if (clearPercentage >= 100) {
      const clearText = this.add
        .text(0, progressBarY + 20, '★ CLEAR ★', {
          fontSize: '16px',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          fill: '#00ff88',
          stroke: '#004422',
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      container.add(clearText);

      // CLEAR 텍스트 반짝임 효과
      this.tweens.add({
        targets: clearText,
        alpha: 0.6,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  showMainMenu() {
    this.clearView();

    const { width, height } = this.cameras.main;
    this.currentView = 'main'; // 게임 타이틀

    const shadowOffset = 4; // 그림자 위치 이동량
    const titleShadow = this.add
      .image(width / 2 + shadowOffset, height / 3 + shadowOffset, 'title')
      .setOrigin(0.5)
      .setTint(0x000000) // 검은색 그림자
      .setAlpha(0.3); // 투명도 조절

    const title = this.add
      .image(width / 2, height / 3, 'title')
      .setOrigin(0.5)
      .setAlpha(0); // 초기 투명

    // 이미지 페이드인 애니메이션
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });

    let startY = height / 2 + 40;
    const buttonSpacing = 70; // NEW GAME 버튼

    const newGameBtn = this.createMenuButton(
      width / 2,
      startY,
      'NEW GAME',
      () => {
        this.showSlotSelection('new');
      },
      false,
      0.2,
    );

    startY += buttonSpacing; // LOAD GAME 버튼 // 저장된 데이터가 있는지 (null이 아닌 슬롯이 있는지) 확인

    const hasSaveData = this.saveSlots.some((slot) => slot !== null);
    const loadGameBtn = this.createMenuButton(
      width / 2,
      startY,
      'LOAD GAME',
      () => {
        this.showSlotSelection('load');
      },
      !hasSaveData, // 저장 데이터가 없으면 비활성화
      0.4,
    );

    startY += buttonSpacing; // EXIT 버튼 (웹에서는 의미 없지만, Electron에서 사용)

    const exitBtn = this.createMenuButton(
      width / 2,
      startY,
      'EXIT',
      () => {
        this.exitGame();
      },
      false,
      0.6,
    ); // 버전 정보

    this.add
      .text(width - 10, height - 10, 'v0.1.0 Alpha', {
        fontSize: '14px',
        fontFamily: 'monospace',
        fill: '#666666',
      })
      .setOrigin(1, 1);

    this.menuElements = [title, newGameBtn, loadGameBtn, exitBtn];
  }

  showSlotSelection(mode) {
    this.clearView();

    const { width, height } = this.cameras.main;
    this.currentView = mode === 'new' ? 'newGame' : 'loadGame'; // 제목

    const titleText = mode === 'new' ? 'SELECT SLOT FOR NEW GAME' : 'SELECT SAVE TO LOAD';
    const title = this.add
      .text(width / 2, 80, titleText, {
        fontSize: '32px',
        fontStyle: 'bold',
        fontFamily: 'RoundedFixedsys',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5); // 세이브 슬롯 카드들

    const slotWidth = 300;
    const slotHeight = 200;
    const slotSpacing = 40;
    const totalWidth = slotWidth * 3 + slotSpacing * 2;
    const startX = width / 2 - totalWidth / 2;
    const slotY = height / 2;

    this.slotElements = [];

    for (let i = 0; i < SaveSlotManager.MAX_SLOTS; i++) {
      const slotX = startX + i * (slotWidth + slotSpacing) + slotWidth / 2; // null 또는 요약 데이터
      const slotSummary = this.saveSlots[i];

      const slotCard = this.createSlotCard(
        slotX,
        slotY,
        slotWidth,
        slotHeight,
        i,
        slotSummary,
        mode,
      );

      this.slotElements.push(slotCard);
    } // BACK 버튼

    const backBtn = this.createMenuButton(width / 2, height - 80, '← BACK', () => {
      this.showMainMenu();
    });

    this.menuElements = [title, backBtn, ...this.slotElements];
  }

  createSlotCard(x, y, width, height, slotIndex, slotSummary, mode) {
    const container = this.add.container(x, y); // 카드 배경

    const cardBg = this.add.rectangle(0, 0, width, height, 0x2a2a3e, 0.9); // null 여부에 따라 테두리 색상 변경
    cardBg.setStrokeStyle(3, slotSummary ? 0x4a9eff : 0x444466); // 슬롯 번호

    const slotNumber = this.add
      .text(-width / 2 + 15, -height / 2 + 15, `SLOT ${slotIndex + 1}`, {
        fontSize: '18px',
        fontStyle: 'bold',
        fontFamily: 'RoundedFixedsys',
        fill: '#888888',
      })
      .setOrigin(0);

    container.add([cardBg, slotNumber]);

    if (slotSummary) {
      // 저장된 데이터가 있는 경우 (null이 아님)
      this.populateSlotWithData(container, width, height, slotSummary); // 클릭 이벤트

      cardBg.setInteractive({ useHandCursor: true });
      cardBg.on('pointerdown', () => {
        if (mode === 'load') {
          this.loadSlot(slotIndex, slotSummary); // 요약 데이터 전달
        } else {
          this.confirmOverwrite(slotIndex);
        }
      }); // 호버 효과

      cardBg.on('pointerover', () => {
        cardBg.setStrokeStyle(4, 0x66ccff);
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Quad.easeOut',
        });
      });

      cardBg.on('pointerout', () => {
        cardBg.setStrokeStyle(3, 0x4a9eff);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Quad.easeOut',
        });
      });
    } else {
      // 빈 슬롯 (null)
      const emptyText = this.add
        .text(0, 0, mode === 'new' ? 'EMPTY\n\nClick to Start' : 'NO SAVE DATA', {
          fontSize: '20px',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          fill: '#666666',
          align: 'center',
        })
        .setOrigin(0.5);

      container.add(emptyText);

      if (mode === 'new') {
        cardBg.setInteractive({ useHandCursor: true });
        cardBg.on('pointerdown', () => {
          this.startNewGame(slotIndex);
        }); // 호버 효과 (새 게임용)

        cardBg.on('pointerover', () => {
          cardBg.setStrokeStyle(4, 0x66ff66);
          emptyText.setFill('#aaaaaa');
        });

        cardBg.on('pointerout', () => {
          cardBg.setStrokeStyle(3, 0x444466);
          emptyText.setFill('#666666');
        });
      }
    } // 페이드인 애니메이션

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 400,
    });

    return container;
  }
  /**
   * 새로운 게임을 시작하고 해당 슬롯을 활성화합니다.
   * @param {number} slotIndex - 선택된 슬롯 인덱스
   */

  javascript;
  /**
   * 새로운 게임을 시작하고 해당 슬롯을 활성화합니다.
   * @param {number} slotIndex - 선택된 슬롯 인덱스
   */
  async startNewGame(slotIndex) {
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', async () => {
      try {
        // 슬롯 선택 및 초기 데이터 생성
        await SaveSlotManager.selectSlot(slotIndex, null);

        // 슬롯이 제대로 생성되었는지 확인
        const createdData = await SaveSlotManager.load(slotIndex);

        // ✅ IntroScene으로 이동 (게임 시작 시에만)
        this.scene.start('IntroScene', {
          slotIndex: slotIndex,
        });
      } catch (error) {
        console.error('새 게임 시작 실패:', error);
      }
    });
  }

  /**
   * 저장된 게임을 로드하고 해당 슬롯을 활성화합니다.
   * @param {number} slotIndex - 선택된 슬롯 인덱스
   * @param {object} slotSummary - 로드할 슬롯의 요약 데이터 (캐릭터 타입 확인용)
   */

  /**
   * 저장된 게임을 로드하고 해당 슬롯을 활성화합니다.
   * @param {number} slotIndex - 선택된 슬롯 인덱스
   * @param {object} slotSummary - 로드할 슬롯의 요약 데이터
   */
  async loadSlot(slotIndex, slotSummary) {
    if (!slotSummary) return;

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', async () => {
      try {
        // 기존 슬롯 선택
        await SaveSlotManager.selectSlot(slotIndex, true);

        // 로드된 데이터 확인
        const loadedData = await SaveSlotManager.load(slotIndex);
        console.log(slotSummary);
        this.scene.start('GameScene', {
          mapKey: slotSummary.mapKey || 'other_cave',
          characterType: slotSummary.characterType || 'soul',
          slotIndex: slotIndex, // 슬롯 인덱스 전달
        });
      } catch (error) {
        console.error('슬롯 로드 실패:', error);
      }
    });
  }
  /**
   * 덮어쓰기 확인 창 (간단한 콘솔/알림으로 대체)
   * @param {number} slotIndex - 덮어쓸 슬롯 인덱스
   */

  confirmOverwrite(slotIndex) {
    if (
      window.confirm(
        `SLOT ${slotIndex + 1}에 기존 데이터가 있습니다. 새로운 게임으로 덮어쓰시겠습니까?`,
      )
    ) {
      this.startNewGame(slotIndex);
    }
  } // --- 기존 도우미 함수 ---

  createMenuButton(x, y, text, callback, disabled = false, delay = 0) {
    const buttonStyle = {
      fontSize: '28px',
      fontStyle: 'bold',
      fontFamily: 'RoundedFixedsys',
      fill: disabled ? '#444444' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    };

    const button = this.add.text(x, y, text, buttonStyle).setOrigin(0.5);

    if (!disabled) {
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        button.setFill('#ffd700'); // Gold hover color
        this.tweens.add({
          targets: button,
          scale: 1.05,
          duration: 100,
        });
      });

      button.on('pointerout', () => {
        button.setFill('#ffffff');
        this.tweens.add({
          targets: button,
          scale: 1,
          duration: 100,
        });
      });

      button.on('pointerdown', callback);
    } // 초기 페이드인 애니메이션

    button.setAlpha(0);
    this.tweens.add({
      targets: button,
      alpha: 1,
      duration: 500,
      delay: 500 + delay * 300,
      ease: 'Quad.easeOut',
    });

    return button;
  }

  clearView() {
    if (this.menuElements) {
      this.menuElements.forEach((element) => element.destroy());
    }
    this.menuElements = [];
  }

  exitGame() {
    // Electron 환경일 경우에만 작동하는 로직
    if (window.electron) {
      window.electron.exitApp();
    } else {
    }
  }
}
