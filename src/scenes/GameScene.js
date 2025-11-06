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
    // this.currentMapKey = data.mapKey || 'forest';
    this.currentMapKey = data.mapKey || 'dark_cave';
    this.mapConfig = MAPS[this.currentMapKey];
  }

  preload() {
    // ✅ 디버그 모드 활성화
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

    // ✅ mapModel.create() - collisionGround와 collisionLayer 모두 받기
    const { spawn, collisionGround, collisionLayer } = this.mapModel.create();

    // 배경 레이어 생성
    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(this.mapConfig.depths.backgroundStart + index);
    });

    // 플레이어 생성
    this.player = new Soul(this, spawn.x, spawn.y, this.mapConfig.playerScale, mapScale);
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    this.mapModel.addPlayer(this.player.sprite);

    this.mapModel.createPortals();

    // 포탈 충돌 체크
    this.mapModel.portals.forEach((portal) => {
      if (!MAPS[portal.targetMap]) {
        console.warn(`포탈 targetMap이 존재하지 않음: ${portal.targetMap}`);
        return;
      }

      this.physics.add.overlap(this.player.sprite, portal, () => {
        console.log(`포탈 이동! ${portal.targetMap}로 이동`);
        this.scene.start('GameScene', { mapKey: portal.targetMap });
      });
    });

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 카메라
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.enemyManager = new EnemyManager(
      this,
      this.mapConfig,
      this.mapModel, // ✅ 변경
      this.player,
    );
    this.enemyManager.createInitial();
  }

  update(time, delta) {
    this.player.update();

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.player.isJumping) {
      this.player.changeState('attack');

      // this.enemyManager?.enemies?.forEach((enemy) => {
      //   if (this.player.checkAttackHit(enemy)) {
      //     enemy.takeDamage(this.mapConfig.enemies.attackDamage || 1);
      //   }
      // });
    }

    // 적 업데이트
    this.enemyManager?.update(time, delta);
  }

  changeMap(newMapKey) {
    // ✅ 정리 추가
    if (this.mapModel) {
      this.mapModel.destroy();
    }
    if (this.enemyManager) {
      this.enemyManager.destroy();
    }

    this.scene.restart({ mapKey: newMapKey });
  }
}
