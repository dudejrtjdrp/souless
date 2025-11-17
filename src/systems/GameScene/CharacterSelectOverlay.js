import CharacterFactory from '../../entities/characters/base/CharacterFactory';

export default class CharacterSelectOverlay {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.selectedIndex = 0;

    // 캐릭터 타입 목록 (순서대로)
    this.characters = CharacterFactory.getAvailableTypes(); // 실제 캐릭터 타입으로 변경

    this.container = null;
    this.icons = [];
    this.holdStartTime = 0;
    this.HOLD_THRESHOLD = 300; // 300ms 이상 누르면 UI 표시
  }

  create() {
    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;

    // 컨테이너 생성
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);
    this.container.setVisible(false);

    // 반투명 배경
    const bg = this.scene.add.rectangle(centerX, centerY, 400, 150, 0x000000, 0.8);
    this.container.add(bg);

    // 타이틀
    const title = this.scene.add
      .text(centerX, centerY - 50, 'Select Character', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.container.add(title);

    // 캐릭터 아이콘들 생성
    const startX = centerX - (this.characters.length - 1) * 60;

    this.characters.forEach((charType, index) => {
      const x = startX + index * 120;
      const y = centerY + 10;

      // 아이콘 배경
      const iconBg = this.scene.add.rectangle(x, y, 80, 80, 0x333333);

      // 캐릭터 이름 텍스트
      const nameText = this.scene.add
        .text(x, y, this.getCharacterName(charType), {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      // 선택 표시 (처음엔 숨김)
      const selector = this.scene.add.rectangle(x, y, 88, 88, 0xffff00, 0);
      selector.setStrokeStyle(3, 0xffff00);

      this.icons.push({
        bg: iconBg,
        text: nameText,
        selector: selector,
        characterType: charType,
      });

      this.container.add([iconBg, nameText, selector]);
    });

    // 힌트 텍스트
    const hint = this.scene.add
      .text(centerX, centerY + 60, 'Use ← → to select, release ` to confirm', {
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.container.add(hint);

    // 현재 캐릭터로 초기 인덱스 설정
    this.updateSelection();
  }

  getCharacterName(charType) {
    const names = {
      assassin: 'Assassin',
      warrior: 'Warrior',
      mage: 'Mage',
    };
    return names[charType] || charType;
  }

  show() {
    if (!this.container) {
      this.create();
    }

    // 현재 캐릭터를 선택된 상태로 설정
    const currentType = this.scene.selectedCharacter;
    const currentIndex = this.characters.indexOf(currentType);
    if (currentIndex !== -1) {
      this.selectedIndex = currentIndex;
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
    if (!this.isVisible) return;

    if (direction === 'left') {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.characters.length) % this.characters.length;
    } else if (direction === 'right') {
      this.selectedIndex = (this.selectedIndex + 1) % this.characters.length;
    }

    this.updateSelection();

    // 선택 사운드 (옵션)
    // this.scene.sound.play('select');
  }

  getSelectedCharacter() {
    return this.characters[this.selectedIndex];
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
    this.icons = [];
  }
}
