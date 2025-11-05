import Phaser from 'phaser';
import Soul from '../models/characters/SoulModel.js';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
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
    // Map preload
    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    // 배경 레이어 preload
    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    // 캐릭터 스프라이트
    this.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 적 스프라이트
    this.mapConfig.enemies?.types?.forEach((type) => {
      this.load.spritesheet(type, `/assets/enemies/${type}.png`, {
        frameWidth: 32,
        frameHeight: 32,
      });
    });
  }

  create() {
    const mapScale = this.mapConfig.mapScale || 1;

    // 월드 중력
    this.physics.world.gravity.y = this.mapConfig.gravity;

    // Depth
    const depths = this.mapConfig.depths || {
      backgroundStart: 0,
      tilemapStart: 0,
      player: 100,
      ui: 1000,
    };

    // Map create
    const { spawn, collisionLayer } = this.mapModel.create();
    this.collisionLayer = collisionLayer;

    // 배경 이미지 레이어
    this.backgroundLayers = this.mapConfig.layers.map((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(depths.backgroundStart + index);
      return img;
    });

    // 플레이어 생성
    const spawnX = typeof spawn.x === 'number' ? spawn.x : 100;
    const spawnY = typeof spawn.y === 'number' ? spawn.y : 600;
    this.player = new Soul(this, spawnX, spawnY, this.mapConfig.playerScale, mapScale);
    this.player.sprite.setDepth(depths.player);

    // 플레이어와 충돌
    this.mapModel.addPlayerCollision(this.player.sprite);

    // 키
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 카메라
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 적 매니저
    if (this.mapConfig.enemies) {
      this.enemyManager = new EnemyManager(this, this.mapConfig, collisionLayer, this.player);
      this.enemyManager.createInitial();
    }
  }

  update(time, delta) {
    // 플레이어 업데이트
    this.player.update();

    // 공격 시 적과 충돌 체크
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.player.isJumping) {
      this.player.changeState('attack');
      this.enemyManager?.enemies?.forEach((enemy) => {
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.player.sprite.getBounds(),
            enemy.sprite.getBounds(),
          )
        ) {
          enemy.takeDamage();
        }
      });
    }

    // 적 업데이트
    this.enemyManager?.update(time, delta);
  }

  changeMap(newMapKey) {
    this.scene.restart({ mapKey: newMapKey });
  }
}
