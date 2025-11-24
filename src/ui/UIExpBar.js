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
      .text(barWidth / 2, barHeight / 2, 'SOUL: Lv.1 | 0 / 100', {
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

  /**
   * 캐릭터 표시 이름 가져오기
   */
  getCharacterDisplayName(characterType) {
    const names = {
      soul: 'SOUL',
      knight: 'KNIGHT',
      warrior: 'WARRIOR',
      wizard: 'WIZARD',
      mage: 'MAGE',
      archer: 'ARCHER',
      rogue: 'ROGUE',
      reaper: 'REAPER',
    };
    return names[characterType] || characterType.toUpperCase();
  }

  /**
   * 캐릭터별 레벨 포함 업데이트 (동기)
   */
  updatePlayerExpSync(characterType, exp) {
    if (!this.playerExpBar || !this.playerExpText) {
      console.warn('⚠️ Player exp bar not initialized');
      return;
    }

    const gameScene = this.scene.scene.get('GameScene');
    const levelSystem = gameScene?.levelSystem;

    if (!levelSystem) {
      // 레벨 시스템이 없으면 기본 표시
      const name = this.getCharacterDisplayName(characterType);
      const validExp = typeof exp === 'number' && exp >= 0 ? exp : 0;
      this.playerExpText.setText(`${name}: ${validExp} EXP`);
      return;
    }

    // 캐릭터 레벨 정보 가져오기
    const charLevelInfo = levelSystem.getCharacterExpInfo(characterType);
    const charLevel = charLevelInfo.level;
    const charExp = charLevelInfo.experience;
    const charExpToNext = charLevelInfo.experienceToNext;

    // 게이지 그리기
    const percent = Math.min(charExp / charExpToNext, 1);
    const width = this.barWidth * percent;

    this.playerExpBar.clear();
    this.drawExpGradient(this.playerExpBar, 0, 0, width, this.barHeight, 0x4dabf7, 0x1971c2);

    // 텍스트에 레벨 정보 포함
    const name = this.getCharacterDisplayName(characterType);
    this.playerExpText.setText(`${name} Lv.${charLevel} | ${charExp} / ${charExpToNext}`);

    // 레벨업 효과
    if (percent >= 1) {
      this.playLevelUpEffect(this.playerExpContainer);
    }
  }

  updatePlayerExp(characterType, exp) {
    this.updatePlayerExpSync(characterType, exp);
  }

  /**
   * 전체 레벨 업데이트
   */
  async updateTotalExp() {
    try {
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

      // 전체 레벨 텍스트
      this.totalExpText.setText(`Total Lv.${level} | ${experience} / ${experienceToNext}`);

      // 레벨업 효과
      if (percent >= 1) {
        this.playLevelUpEffect(this.totalExpContainer);
      }
    } catch (error) {
      console.error('[ExpBar] updateTotalExp 실패:', error);
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
