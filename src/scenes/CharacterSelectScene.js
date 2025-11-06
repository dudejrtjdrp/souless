import Phaser from 'phaser';
import CharacterFactory from '../characters/base/CharacterFactory.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  preload() {
    // 캐릭터 미리보기용 스프라이트 로드
    this.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 타이틀
    this.add
      .text(400, 100, 'Select Your Character', {
        fontSize: '48px',
        fill: '#fff',
      })
      .setOrigin(0.5);

    // 사용 가능한 캐릭터 목록
    const types = CharacterFactory.getAvailableTypes();
    const startX = 200;
    const spacing = 250;

    types.forEach((type, index) => {
      const x = startX + index * spacing;
      const y = 300;

      // 배경 박스
      const bg = this.add.rectangle(x, y, 200, 250, 0x16213e);
      bg.setStrokeStyle(3, 0x0f3460);

      // 캐릭터 이름
      this.add
        .text(x, y - 80, type.toUpperCase(), {
          fontSize: '24px',
          fill: '#fff',
        })
        .setOrigin(0.5);

      // 미리보기 (간단한 아이콘)
      const preview = this.add.rectangle(x, y, 60, 80, 0x53b3cb);

      // 선택 버튼
      const button = this.add
        .text(x, y + 80, 'SELECT', {
          fontSize: '20px',
          fill: '#fff',
          backgroundColor: '#e94560',
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive();

      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#ff6b81' });
        bg.setStrokeStyle(3, 0x53b3cb);
      });

      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#e94560' });
        bg.setStrokeStyle(3, 0x0f3460);
      });

      button.on('pointerdown', () => {
        console.log('Selected character:', type);
        this.scene.start('GameScene', { characterType: type });
      });
    });
  }
}
