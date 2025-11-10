// ui/UIExpBar.js
export default class UIExpBar {
  constructor(scene, x = 20, y = 70) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setScrollFactor(0).setDepth(1000);

    // 배경
    this.bg = scene.add.rectangle(0, 0, 200, 12, 0x333333).setOrigin(0);
    this.bar = scene.add.rectangle(0, 0, 0, 12, 0x00bfff).setOrigin(0);

    // 텍스트
    this.text = scene.add.text(210, -4, 'EXP: 0 / 1000', {
      fontSize: '14px',
      color: '#ffffff',
    });

    this.container.add([this.bg, this.bar, this.text]);
  }

  update(currentExp, nextLevelExp) {
    const percent = Math.min(currentExp / nextLevelExp, 1);
    this.bar.width = 200 * percent;
    this.text.setText(`EXP: ${currentExp} / ${nextLevelExp}`);
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
