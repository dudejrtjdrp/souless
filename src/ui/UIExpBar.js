import SaveSlotManager from '../utils/SaveSlotManager';

export default class UIExpBar {
  constructor(scene, centerX, topY) {
    this.scene = scene;

    const barWidth = 400;
    const barHeight = 20;
    const gap = 32;

    // === 총 경험치 바 ===
    this.totalExpContainer = scene.add
      .container(centerX - barWidth / 2, topY)
      .setScrollFactor(0)
      .setDepth(1001);

    this.totalExpLabel = scene.add
      .text(0, -20, '🌟 TOTAL LEVEL', {
        fontSize: '14px',
        color: '#ffd43b',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0);

    this.totalExpBg = scene.add.graphics();
    this.totalExpBg.fillStyle(0x1a1a1a, 0.9);
    this.totalExpBg.fillRoundedRect(0, 0, barWidth, barHeight, 10);
    this.totalExpBg.lineStyle(2, 0x444444, 1);
    this.totalExpBg.strokeRoundedRect(0, 0, barWidth, barHeight, 10);

    this.totalExpBar = scene.add.graphics();

    this.totalExpText = scene.add
      .text(barWidth / 2, barHeight / 2, 'Lv.1 | 0 / 100', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.totalExpContainer.add([
      this.totalExpLabel,
      this.totalExpBg,
      this.totalExpBar,
      this.totalExpText,
    ]);

    // === 플레이어(캐릭터) 경험치 바 ===
    this.playerExpContainer = scene.add
      .container(centerX - barWidth / 2, topY + gap)
      .setScrollFactor(0)
      .setDepth(1001);

    this.playerExpLabel = scene.add
      .text(0, -20, '⚔️ CHARACTER', {
        fontSize: '14px',
        color: '#4dabf7',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0);

    this.playerExpBg = scene.add.graphics();
    this.playerExpBg.fillStyle(0x1a1a1a, 0.9);
    this.playerExpBg.fillRoundedRect(0, 0, barWidth, barHeight, 10);
    this.playerExpBg.lineStyle(2, 0x444444, 1);
    this.playerExpBg.strokeRoundedRect(0, 0, barWidth, barHeight, 10);

    this.playerExpBar = scene.add.graphics();

    this.playerExpText = scene.add
      .text(barWidth / 2, barHeight / 2, 'SOUL: 0', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.playerExpContainer.add([
      this.playerExpLabel,
      this.playerExpBg,
      this.playerExpBar,
      this.playerExpText,
    ]);

    this.barWidth = barWidth;
    this.barHeight = barHeight;
  }

  // ✅ null 체크 추가
  updatePlayerExpSync(characterType, exp) {
    // null 체크
    if (!this.playerExpBar || !this.playerExpText) {
      console.warn('⚠️ Player exp bar not initialized');
      return;
    }

    const characterNames = {
      soul: 'SOUL',
      warrior: 'WARRIOR',
      mage: 'MAGE',
      archer: 'ARCHER',
      rogue: 'ROGUE',
    };

    const name = characterNames[characterType] || characterType.toUpperCase();
    const validExp = typeof exp === 'number' && exp >= 0 ? exp : 0;

    // 게이지
    this.playerExpBar.clear();

    const maxDisplay = 1000;
    const displayExp = Math.min(validExp, maxDisplay);
    const percent = displayExp / maxDisplay;
    const width = this.barWidth * percent;

    this.drawExpGradient(this.playerExpBar, 0, 0, width, this.barHeight, 0x4dabf7, 0x339af0);

    // 텍스트
    this.playerExpText.setText(`${name}: ${validExp} EXP`);
  }

  updatePlayerExp(characterType, exp) {
    this.updatePlayerExpSync(characterType, exp);
  }

  // ✅ null 체크 추가
  async updateTotalExp() {
    try {
      // null 체크
      if (!this.totalExpBar || !this.totalExpText) {
        console.warn('⚠️ Total exp bar not initialized');
        return;
      }

      const saveData = await SaveSlotManager.load();

      if (!saveData || !saveData.levelSystem) {
        console.warn('⚠️ [ExpBar] 레벨 시스템 데이터 없음');
        return;
      }

      const { level, experience, experienceToNext } = saveData.levelSystem;
      const percent = Math.min(experience / experienceToNext, 1);

      // 게이지 그리기
      this.totalExpBar.clear();
      const width = this.barWidth * percent;

      this.drawExpGradient(this.totalExpBar, 0, 0, width, this.barHeight, 0xffd43b, 0xf59f00);

      // 텍스트 업데이트
      this.totalExpText.setText(`Lv.${level} | ${experience} / ${experienceToNext}`);

      // 레벨업 효과
      if (percent >= 1) {
        this.playLevelUpEffect(this.totalExpContainer);
      }
    } catch (error) {
      console.error('❌ [ExpBar] updateTotalExp 실패:', error);
    }
  }

  drawExpGradient(graphics, x, y, width, height, color1, color2) {
    if (width <= 0 || !graphics) return;

    const steps = 10;
    const stepWidth = width / steps;

    for (let i = 0; i < steps; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(color1),
        Phaser.Display.Color.ValueToColor(color2),
        steps,
        i,
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      graphics.fillStyle(hexColor, 1);
      graphics.fillRect(x + i * stepWidth, y, stepWidth, height);
    }

    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillRect(x, y, width, height * 0.3);

    graphics.lineStyle(0);
    graphics.fillRoundedRect(x, y, width, height, 10);
  }

  playLevelUpEffect(container) {
    if (!container) return;

    this.scene.tweens.add({
      targets: container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 200,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }

  hide() {
    if (this.totalExpContainer) this.totalExpContainer.setVisible(false);
    if (this.playerExpContainer) this.playerExpContainer.setVisible(false);
  }

  show() {
    if (this.totalExpContainer) this.totalExpContainer.setVisible(true);
    if (this.playerExpContainer) this.playerExpContainer.setVisible(true);
  }

  destroy() {
    if (this.totalExpContainer) {
      this.totalExpContainer.destroy();
    }
    if (this.playerExpContainer) {
      this.playerExpContainer.destroy();
    }
  }
}
