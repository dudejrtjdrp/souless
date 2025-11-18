// ui/UIExpBar.js
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

    // 라벨
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

    // 배경
    this.totalExpBg = scene.add.graphics();
    this.totalExpBg.fillStyle(0x1a1a1a, 0.9);
    this.totalExpBg.fillRoundedRect(0, 0, barWidth, barHeight, 10);
    this.totalExpBg.lineStyle(2, 0x444444, 1);
    this.totalExpBg.strokeRoundedRect(0, 0, barWidth, barHeight, 10);

    // 게이지
    this.totalExpBar = scene.add.graphics();

    // 레벨 텍스트
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

    // 라벨
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

    // 배경
    this.playerExpBg = scene.add.graphics();
    this.playerExpBg.fillStyle(0x1a1a1a, 0.9);
    this.playerExpBg.fillRoundedRect(0, 0, barWidth, barHeight, 10);
    this.playerExpBg.lineStyle(2, 0x444444, 1);
    this.playerExpBg.strokeRoundedRect(0, 0, barWidth, barHeight, 10);

    // 게이지
    this.playerExpBar = scene.add.graphics();

    // 경험치 텍스트
    this.playerExpText = scene.add
      .text(barWidth / 2, barHeight / 2, 'WARRIOR: 0', {
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

    // 속성 저장
    this.barWidth = barWidth;
    this.barHeight = barHeight;
  }

  // 총 경험치 업데이트
  updateTotalExp(currentExp, nextLevelExp, level) {
    const percent = Math.min(currentExp / nextLevelExp, 1);

    // 게이지 그리기 (황금색 그라디언트)
    this.totalExpBar.clear();
    const width = this.barWidth * percent;

    this.drawExpGradient(this.totalExpBar, 0, 0, width, this.barHeight, 0xffd43b, 0xf59f00);

    // 텍스트 업데이트
    this.totalExpText.setText(`Lv.${level} | ${currentExp} / ${nextLevelExp}`);

    // 레벨업 효과 (100% 도달 시)
    if (percent >= 1) {
      this.playLevelUpEffect(this.totalExpContainer);
    }
  }

  // 플레이어 경험치 업데이트
  updatePlayerExp(characterType, exp) {
    const characterNames = {
      warrior: 'WARRIOR',
      mage: 'MAGE',
      archer: 'ARCHER',
      rogue: 'ROGUE',
    };

    const name = characterNames[characterType] || characterType.toUpperCase();

    // 간단한 게이지 (경험치 비율 시각화)
    this.playerExpBar.clear();

    // 경험치에 따른 진행도 (0~1000 범위로 가정)
    const maxDisplay = 1000;
    const displayExp = Math.min(exp, maxDisplay);
    const percent = displayExp / maxDisplay;
    const width = this.barWidth * percent;

    this.drawExpGradient(this.playerExpBar, 0, 0, width, this.barHeight, 0x4dabf7, 0x339af0);

    // 텍스트 업데이트
    this.playerExpText.setText(`${name}: ${exp} EXP`);
  }

  drawExpGradient(graphics, x, y, width, height, color1, color2) {
    if (width <= 0) return;

    // 가로 그라디언트
    const steps = 20;
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

    // 하이라이트 효과 (상단에 밝은 선)
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillRect(x, y, width, height * 0.3);

    // 모서리 둥글게
    graphics.lineStyle(0);
    graphics.fillRoundedRect(x, y, width, height, 10);
  }

  playLevelUpEffect(container) {
    // 간단한 펄스 효과
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
    this.totalExpContainer.setVisible(false);
    this.playerExpContainer.setVisible(false);
  }

  show() {
    this.totalExpContainer.setVisible(true);
    this.playerExpContainer.setVisible(true);
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
