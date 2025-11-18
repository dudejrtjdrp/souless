// ui/UIHealthMana.js
export default class UIHealthMana {
  constructor(scene, centerX, y) {
    this.scene = scene;

    const barWidth = 300;
    const barHeight = 24;
    const gap = 8;

    this.container = scene.add
      .container(centerX - barWidth / 2, y)
      .setScrollFactor(0)
      .setDepth(1001);

    // === HP 바 ===
    // 외곽 테두리
    this.hpBorder = scene.add.graphics();
    this.hpBorder.lineStyle(2, 0x000000, 0.8);
    this.hpBorder.strokeRoundedRect(-2, -2, barWidth + 4, barHeight + 4, 4);

    // 배경 (어두운 레드)
    this.hpBg = scene.add.graphics();
    this.hpBg.fillStyle(0x3d0000, 0.9);
    this.hpBg.fillRoundedRect(0, 0, barWidth, barHeight, 4);

    // HP 게이지 (그라디언트 효과)
    this.hpBar = scene.add.graphics();

    // HP 텍스트
    this.hpText = scene.add
      .text(barWidth / 2, barHeight / 2, 'HP: 100 / 100', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // === MP 바 ===
    const mpY = barHeight + gap;

    // 외곽 테두리
    this.mpBorder = scene.add.graphics();
    this.mpBorder.lineStyle(2, 0x000000, 0.8);
    this.mpBorder.strokeRoundedRect(-2, mpY - 2, barWidth + 4, barHeight + 4, 4);

    // 배경 (어두운 블루)
    this.mpBg = scene.add.graphics();
    this.mpBg.fillStyle(0x001a3d, 0.9);
    this.mpBg.fillRoundedRect(0, mpY, barWidth, barHeight, 4);

    // MP 게이지
    this.mpBar = scene.add.graphics();

    // MP 텍스트
    this.mpText = scene.add
      .text(barWidth / 2, mpY + barHeight / 2, 'MP: 100 / 100', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // 컨테이너에 추가
    this.container.add([
      this.hpBorder,
      this.hpBg,
      this.hpBar,
      this.hpText,
      this.mpBorder,
      this.mpBg,
      this.mpBar,
      this.mpText,
    ]);

    // 초기값
    this.barWidth = barWidth;
    this.barHeight = barHeight;
    this.mpY = mpY;
  }

  update(player) {
    if (!player) return;

    const hp = Math.round(player.health);
    const maxHp = Math.round(player.maxHealth);
    const mp = Math.round(player.mana);
    const maxMp = Math.round(player.maxMana);

    const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
    const mpPercent = Math.max(0, Math.min(1, mp / maxMp));

    // HP 바 그리기 (그라디언트)
    this.hpBar.clear();
    const hpWidth = this.barWidth * hpPercent;

    // HP 색상 변화 (낮을수록 더 어두운 빨강)
    let hpColor1, hpColor2;
    if (hpPercent > 0.5) {
      hpColor1 = 0xff6b6b;
      hpColor2 = 0xff4757;
    } else if (hpPercent > 0.25) {
      hpColor1 = 0xff4757;
      hpColor2 = 0xe84118;
    } else {
      hpColor1 = 0xe84118;
      hpColor2 = 0xc23616;
    }

    this.drawGradientBar(this.hpBar, 0, 0, hpWidth, this.barHeight, hpColor1, hpColor2);

    // MP 바 그리기 (그라디언트)
    this.mpBar.clear();
    const mpWidth = this.barWidth * mpPercent;

    this.drawGradientBar(this.mpBar, 0, this.mpY, mpWidth, this.barHeight, 0x4dabf7, 0x339af0);

    // 텍스트 업데이트
    this.hpText.setText(`HP: ${hp} / ${maxHp}`);
    this.mpText.setText(`MP: ${mp} / ${maxMp}`);

    // HP 낮을 때 깜빡임 효과
    if (hpPercent < 0.25) {
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      this.hpText.setAlpha(pulse);
    } else {
      this.hpText.setAlpha(1);
    }
  }

  drawGradientBar(graphics, x, y, width, height, color1, color2) {
    if (width <= 0) return;

    // 세로 그라디언트 효과 (위가 밝고 아래가 어둡게)
    const steps = 10;
    const stepHeight = height / steps;

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(color1),
        Phaser.Display.Color.ValueToColor(color2),
        steps,
        i,
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      graphics.fillStyle(hexColor, 1);
      graphics.fillRect(x, y + i * stepHeight, width, stepHeight);
    }

    // 모서리 둥글게
    graphics.lineStyle(0);
    graphics.fillStyle(color1, 0);
    graphics.fillRoundedRect(x, y, width, height, 4);
  }

  hide() {
    this.container.setVisible(false);
  }

  show() {
    this.container.setVisible(true);
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
  }
}
