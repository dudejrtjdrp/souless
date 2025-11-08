// scenes/GameScene.js
import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/mapData.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    // this.currentMapKey = data.mapKey || 'dark_cave';
    this.currentMapKey = data.mapKey || 'forest';
    this.selectedCharacter = data.characterType || 'monk';
    // this.selectedCharacter = data.characterType || 'soul';
    this.mapConfig = MAPS[this.currentMapKey];
  }

  preload() {
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

    // 포탈 생성
    this.mapModel.createPortals();

    const portals = [this.mapModel.getPortal()[0].x, this.mapModel.getPortal()[0].y];

    // 🎮 플레이어 생성
    this.player = CharacterFactory.create(this, this.selectedCharacter, spawn.x, spawn.y, {
      scale: this.mapConfig.playerScale || 1,
      portals: portals,
    });

    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 맵에 플레이어 추가 (충돌 설정)
    this.mapModel.addPlayer(this.player.sprite);

    // 카메라 설정
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);

    // 적 매니저 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();
  }

  update(time, delta) {
    if (!this.player) return;

    // 플레이어 업데이트
    this.player.update();

    // 포탈 체크
    this.checkPortals();

    // 적 업데이트
    if (this.enemyManager) {
      this.enemyManager.update(time, delta);
    }

    // ⭐ 충돌 체크 (기본 공격 + 스킬)
    this.checkAttackCollisions();
  }

  checkAttackCollisions() {
    if (!this.enemyManager?.enemies) return;
    if (!this.player) return;

    this.enemyManager.enemies.forEach((enemy) => {
      const enemyTarget = enemy.sprite || enemy;

      // 기본 공격 체크
      if (this.player.isAttacking && this.player.isAttacking()) {
        if (this.player.checkAttackHit(enemyTarget)) {
          const damage = 10;
          if (enemy.takeDamage) {
            enemy.takeDamage(damage);
            console.log(`💥 기본 공격 히트! ${damage} 데미지`);
          }
        }
      }

      // ⭐ 스킬 히트 체크
      if (this.player.isUsingSkill && this.player.isUsingSkill()) {
        const skillHit = this.player.checkSkillHit(enemyTarget);
        if (skillHit && skillHit.hit) {
          if (enemy.takeDamage) {
            enemy.takeDamage(skillHit.damage);

            // 넉백 적용
            if (skillHit.knockback && enemyTarget.body) {
              const facingRight = this.player.sprite.flipX ? false : true;
              const knockbackX = facingRight ? skillHit.knockback.x : -skillHit.knockback.x;
              enemyTarget.setVelocityX(knockbackX);
              enemyTarget.setVelocityY(skillHit.knockback.y);
            }

            // 이펙트 적용
            if (skillHit.effects) {
              if (skillHit.effects.includes('stun')) {
                console.log('스턴 효과!');
                // 스턴 로직 구현
              }
              if (skillHit.effects.includes('burn')) {
                console.log('화상 효과!');
                // 화상 로직 구현
              }
              if (skillHit.effects.includes('knockdown')) {
                console.log('넉다운 효과!');
                // 넉다운 로직 구현
              }
            }

            console.log(`스킬 히트! ${skillHit.damage} 데미지`, skillHit);
          }
        }
      }
    });
  }

  checkPortals() {
    this.mapModel.portals.forEach((portal) => {
      const playerBounds = this.player.sprite.getBounds();
      const portalBounds = portal.getBounds();

      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, portalBounds)) {
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
