import Phaser from 'phaser';
import Soul from '../models/characters/SoulModel.js';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/maps.js';
import Slime from '../entities/enemies/Slime.js';
import Goblin from '../entities/enemies/Canine.js';
import Bat from '../entities/enemies/Bat.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentMapKey = data.mapKey || 'forest';
    this.mapConfig = MAPS[this.currentMapKey];
  }

  preload() {
    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    this.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    EnemyAssetLoader.preload(this);
  }

  create() {
    this.physics.world.gravity.y = this.mapConfig.gravity;
    const mapScale = this.mapConfig.mapScale || 1;

    const { spawn, collisionLayer } = this.mapModel.create();

    // 배경 레이어 생성
    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(this.mapConfig.depths.backgroundStart + index);
    });

    // 플레이어 생성
    this.player = new Soul(this, spawn.x, spawn.y, this.mapConfig.playerScale, mapScale);
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 충돌 연결
    this.mapModel.addPlayerCollision(this.player.sprite);

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 카메라
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // EnemyManager 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, collisionLayer, this.player);
    this.enemyManager.createInitial();
  }

  update(time, delta) {
    this.player.update();

    // 적 공격 판정 (hitbox 기준)
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
