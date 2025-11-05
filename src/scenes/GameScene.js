import Phaser from 'phaser';
import Soul from '../models/characters/SoulModel.js';
import MapModel from '../models/map/MapModel.js';
import { MAPS } from '../config/maps.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentMapKey = data.mapKey || 'forest';
    this.mapConfig = MAPS[this.currentMapKey];
  }

  preload() {
    // MapModel preload
    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    // GameScene용 배경 레이어 이미지 preload
    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    // 캐릭터 스프라이트
    this.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // 월드 중력
    this.physics.world.gravity.y = this.mapConfig.gravity;

    const mapScale = this.mapConfig.mapScale || 1;

    // Depth 설정 가져오기 (없으면 기본값)
    const depths = this.mapConfig.depths || {
      backgroundStart: 0,
      tilemapStart: -100,
      player: 100,
      ui: 1000,
    };

    // MapModel create
    const { spawn, collisionLayer } = this.mapModel.create();

    // GameScene용 이미지 레이어 생성 (parallax 등)
    // 타일맵보다 뒤에 배치
    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(depths.backgroundStart + index);
    });

    // 플레이어 생성
    this.player = new Soul(this, spawn.x, spawn.y, this.mapConfig.playerScale, mapScale);
    this.player.sprite.setDepth(depths.player);

    // 플레이어와 충돌 연결 (MapModel collisionLayer 사용)
    this.mapModel.addPlayerCollision(this.player.sprite);

    // 키 설정
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 카메라 설정 (경계는 MapModel에서 설정됨)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }

  update(time, delta) {
    this.player.update(time, delta);
  }

  changeMap(newMapKey) {
    this.scene.restart({ mapKey: newMapKey });
  }
}
