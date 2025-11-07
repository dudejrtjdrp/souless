// scenes/GameScene.js
import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/maps.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentMapKey = data.mapKey || 'dark_cave';
    this.mapConfig = MAPS[this.currentMapKey];
    // this.selectedCharacter = data.characterType || 'soul';
    this.selectedCharacter = data.characterType || 'monk';
  }

  preload() {
    // 맵 로드
    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    CharacterAssetLoader.preload(this);
    EnemyAssetLoader.preload(this);
  }

  create() {
    this.physics.world.gravity.y = this.mapConfig.gravity;
    const mapScale = this.mapConfig.mapScale || 1;

    // 맵 생성
    const { spawn, collisionGround, collisionLayer } = this.mapModel.create();

    // 배경 레이어 생성
    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(this.mapConfig.depths.backgroundStart + index);
    });

    // 🎮 플레이어 생성 (CharacterFactory 사용)
    this.player = CharacterFactory.create(this, this.selectedCharacter, spawn.x, spawn.y, {
      scale: this.mapConfig.playerScale || 1,
    });

    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 맵에 플레이어 추가 (충돌 설정)
    this.mapModel.addPlayer(this.player.sprite);

    // 포탈 생성
    this.mapModel.createPortals();

    // 카메라 설정
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);

    // 적 매니저 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();

    console.log('GameScene created with character:', this.selectedCharacter);
  }

  update(time, delta) {
    if (!this.player) return;

    // 플레이어 업데이트
    this.player.update();

    // 포탈 체크
    this.checkPortals();

    // 적 업데이트 (여기서 공격 체크도 함께 처리됨)
    if (this.enemyManager) {
      this.enemyManager.update(time, delta);
    }
  }

  checkAttackCollisions() {
    if (!this.player.isAttacking()) return;

    // 적들과 충돌 체크
    this.enemyManager?.enemies?.forEach((enemy) => {
      if (this.player.checkAttackHit(enemy.sprite || enemy)) {
        const damage = this.mapConfig.enemies?.attackDamage || 10;

        // 적이 takeDamage 메서드가 있는지 확인
        if (enemy.takeDamage) {
          enemy.takeDamage(damage);
        } else {
          console.log('Enemy hit but no takeDamage method');
          // 간단히 제거하거나 효과 추가
          const sprite = enemy.sprite || enemy;
          sprite.setTint(0xff0000);
          this.time.delayedCall(100, () => {
            sprite.clearTint();
          });
        }

        console.log('Hit enemy!', damage, 'damage');
      }
    });
  }

  checkPortals() {
    this.mapModel.portals.forEach((portal) => {
      const playerBounds = this.player.sprite.getBounds();
      const portalBounds = portal.getBounds();

      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, portalBounds)) {
        // InputHandler가 이미 키 입력을 처리하므로
        // 직접 체크는 필요없지만 호환성을 위해 유지
        const cursors = this.input.keyboard.createCursorKeys();

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
          const targetMap = portal.targetMap;
          if (!MAPS[targetMap]) {
            console.warn(`포탈 targetMap이 존재하지 않음: ${targetMap}`);
            return;
          }
          console.log(`포탈 이동! ${targetMap}로 이동`);
          this.changeMap(targetMap);
        }
      }
    });
  }

  checkAttackCollisions() {
    if (!this.player.isAttacking()) return;

    // 적들과 충돌 체크
    this.enemyManager?.enemies?.forEach((enemy) => {
      if (this.player.checkAttackHit(enemy.sprite || enemy)) {
        const damage = this.mapConfig.enemies.attackDamage || 1;
        enemy.takeDamage(damage);
      }
    });
  }

  changeMap(newMapKey) {
    // 정리
    if (this.mapModel) {
      this.mapModel.destroy();
    }
    if (this.enemyManager) {
      this.enemyManager.destroy();
    }
    if (this.player) {
      this.player.destroy();
    }

    // 새 맵으로 재시작
    this.scene.restart({
      mapKey: newMapKey,
      characterType: this.selectedCharacter,
    });
  }
}
