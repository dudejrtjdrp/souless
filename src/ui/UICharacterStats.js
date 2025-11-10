import SaveManager from '../utils/SaveManager';

export default class UICharacterStats {
  constructor(scene, x = 20, y = 100) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setScrollFactor(0).setDepth(1000);
    this.text = scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      lineSpacing: 4,
    });
    this.container.add(this.text);
  }

  async refresh() {
    const { totalExp, characterExp } = await SaveManager.getExpData();
    const lines = [`🌟 Total EXP: ${totalExp}`];

    for (const [char, exp] of Object.entries(characterExp)) {
      lines.push(`${char.toUpperCase()} EXP: ${exp}`);
    }

    this.text.setText(lines.join('\n'));
  }
}
