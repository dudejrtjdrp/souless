import CharacterFactory from '../../entities/characters/base/CharacterFactory.js';

// 캐릭터 타입 목록
const CHARACTER_TYPES = [
  'soul',
  'assassin',
  'monk',
  'bladekeeper',
  'fireknight',
  'mauler',
  'princess',
];

// 아이콘 크기 정의
const ICON_BG_SIZE = 80;
const ICON_IMAGE_SIZE = ICON_BG_SIZE - 4; // 76px
const ICON_PNG_SIZE = 32;

export default class CharacterSelectOverlay {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.selectedIndex = 0;

    this.characters = [];

    this.container = null;
    this.icons = [];
    this.holdStartTime = 0;
    this.HOLD_THRESHOLD = 300;
  }

  preload() {
    CHARACTER_TYPES.forEach((charType) => {
      this.scene.load.spritesheet(`${charType}_icon`, `assets/ui/character/${charType}.png`, {
        frameWidth: ICON_PNG_SIZE,
        frameHeight: ICON_PNG_SIZE,
      });
      console.log(`✅ Spritesheet 로드: ${charType}_icon from ${charType}.png`);
    });
  }

  async create() {
    this.characters = await CharacterFactory.getAvailableCharacters();

    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);
    this.container.setVisible(false);

    const bgWidth = Math.max(400, this.characters.length * 100 + 50);
    const bg = this.scene.add.rectangle(centerX, centerY, bgWidth, 180, 0x000000, 0.8);
    this.container.add(bg);

    const title = this.scene.add
      .text(centerX, centerY - 60, 'Select Character', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.container.add(title);

    const iconSpacing = 100;
    const iconY = centerY + 10;
    const startX = centerX - ((this.characters.length - 1) * iconSpacing) / 2;

    this.characters.forEach((charType, index) => {
      const x = startX + index * iconSpacing;
      const y = iconY;

      const iconBg = this.scene.add.rectangle(x, y, ICON_BG_SIZE, ICON_BG_SIZE, 0x333333);

      const imageY = y;
      const iconImage = this.scene.add
        .image(x, imageY, `${charType}_icon`, 0)
        .setDisplaySize(ICON_IMAGE_SIZE, ICON_IMAGE_SIZE)
        .setScale(1.8);

      const nameText = this.scene.add
        .text(x, y + 50, this.getCharacterName(charType), {
          fontSize: '12px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      const selector = this.scene.add.rectangle(
        x,
        y,
        ICON_BG_SIZE + 8,
        ICON_BG_SIZE + 8,
        0xffff00,
        0,
      );
      selector.setStrokeStyle(3, 0xffff00);

      this.icons.push({
        bg: iconBg,
        icon: iconImage,
        text: nameText,
        selector: selector,
        characterType: charType,
      });

      this.container.add([iconBg, iconImage, nameText, selector]);
    });

    const hint = this.scene.add
      .text(centerX, centerY + 80, 'Use ← → to select, release ` to confirm', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.container.add(hint);

    this.updateSelection();
  }

  getCharacterName(charType) {
    const names = {
      soul: 'Soul',
      assassin: 'Assassin',
      warrior: 'Warrior',
      monk: 'Monk',
      bladekeeper: 'Bladekeeper',
      fireknight: 'Fireknight',
      mauler: 'Mauler',
      princess: 'Princess',
    };
    return names[charType] || charType;
  }

  async show() {
    if (!this.container) {
      await this.create();
    }

    const currentType = this.scene.selectedCharacter;
    const currentIndex = this.characters.indexOf(currentType);
    if (currentIndex !== -1) {
      this.selectedIndex = currentIndex;
    } else {
      this.selectedIndex = 0;
    }

    this.updateSelection();
    this.container.setVisible(true);
    this.isVisible = true;
  }

  hide() {
    if (this.container) {
      this.container.setVisible(false);
    }
    this.isVisible = false;
  }

  updateSelection() {
    if (this.icons.length === 0) return;

    this.icons.forEach((icon, index) => {
      if (index === this.selectedIndex) {
        icon.selector.setAlpha(1);
        icon.text.setColor('#ffff00');
        icon.bg.setFillStyle(0x555555);
      } else {
        icon.selector.setAlpha(0);
        icon.text.setColor('#ffffff');
        icon.bg.setFillStyle(0x333333);
      }
    });
  }

  moveSelection(direction) {
    if (!this.isVisible || this.characters.length === 0) return;

    if (direction === 'left') {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.characters.length) % this.characters.length;
    } else if (direction === 'right') {
      this.selectedIndex = (this.selectedIndex + 1) % this.characters.length;
    }

    this.updateSelection();
  }

  getSelectedCharacter() {
    return this.characters[this.selectedIndex] || 'soul';
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
    this.icons = [];
    this.characters = [];
  }
}
