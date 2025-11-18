// scenes/SoulScene.js
import Phaser from 'phaser';
import Soul from '../entities/characters/playable/Soul.js';

export default class SoulScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SoulScene' });
  }

  init(data) {
    // GameScene에서 전달받은 데이터
    this.spawnX = data.spawnX || 100;
    this.spawnY = data.spawnY || 300;
    this.scale = data.scale || 1;
  }

  preload() {
    // 스프라이트 시트 로드
    this.load.spritesheet('soul', 'assets/images/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // Soul 캐릭터 생성 (새로운 시스템 사용)
    this.soul = new Soul(this, this.spawnX, this.spawnY, {
      scale: this.scale,
    });

    // 이벤트 발생 (GameScene이 리스닝)
    this.events.emit('soulCreated', this.soul);
  }

  update() {
    if (this.soul) {
      this.soul.update();
    }
  }

  // GameScene에서 호출할 수 있는 메서드들
  getSoul() {
    return this.soul;
  }

  destroy() {
    if (this.soul) {
      this.soul.destroy();
    }
  }
}
