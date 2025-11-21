import CharacterFactory from '../../entities/characters/base/CharacterFactory.js';

export default class CharacterSelectOverlay {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.selectedIndex = 0;

    // 🎯 처음엔 빈 배열, show()에서 로드
    this.characters = [];

    this.container = null;
    this.icons = [];
    this.holdStartTime = 0;
    this.HOLD_THRESHOLD = 300; // 300ms 이상 누르면 UI 표시
  }

  async create() {
    // 🎯 저장된 데이터에서 사용 가능한 캐릭터만 로드
    this.characters = await CharacterFactory.getAvailableCharacters();

    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;

    // 컨테이너 생성
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);
    this.container.setVisible(false);

    // 반투명 배경 (캐릭터 개수에 따라 크기 조정)
    const bgWidth = Math.max(400, this.characters.length * 100 + 50);
    const bg = this.scene.add.rectangle(centerX, centerY, bgWidth, 150, 0x000000, 0.8);
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
    const iconSpacing = 100;
    const startX = centerX - ((this.characters.length - 1) * iconSpacing) / 2;

    this.characters.forEach((charType, index) => {
      const x = startX + index * iconSpacing;
      const y = centerY + 10;

      // 아이콘 배경
      const iconBg = this.scene.add.rectangle(x, y, 80, 80, 0x333333);

      // 캐릭터 이름 텍스트
      const nameText = this.scene.add
        .text(x, y, this.getCharacterName(charType), {
          fontSize: '12px',
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
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.container.add(hint);

    // 현재 캐릭터로 초기 인덱스 설정
    this.updateSelection();
  }

  getCharacterName(charType) {
    const names = {
      soul: 'Soul',
      assassin: 'Assassin',
      warrior: 'Warrior',
      monk: 'Monk',
      magician: 'Magician',
      bladekeeper: 'Bladekeeper',
      fireknight: 'Fireknight',
      ranger: 'Ranger',
      mauler: 'Mauler',
      princess: 'Princess',
    };
    return names[charType] || charType;
  }

  async show() {
    if (!this.container) {
      await this.create();
    }

    // 🎯 현재 캐릭터를 선택된 상태로 설정
    const currentType = this.scene.selectedCharacter;
    const currentIndex = this.characters.indexOf(currentType);
    if (currentIndex !== -1) {
      this.selectedIndex = currentIndex;
    } else {
      this.selectedIndex = 0; // 기본값: 첫 번째 캐릭터
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
