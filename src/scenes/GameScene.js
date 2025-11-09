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

  init(data = {}) {
    // ✅ data가 없어도 기본값 설정
    this.currentMapKey = data.mapKey || 'forest';
    // this.selectedCharacter = data.characterType || 'monk';
    this.selectedCharacter = data.characterType || 'assassin';

    console.log('🎮 GameScene init:', {
      mapKey: this.currentMapKey,
      character: this.selectedCharacter,
    });

    // ✅ MAPS에서 config 가져오기
    this.mapConfig = MAPS[this.currentMapKey];

    if (!this.mapConfig) {
      console.error(`❌ Map config not found for key: "${this.currentMapKey}"`);
      console.log('Available maps:', Object.keys(MAPS));
      // 기본값으로 forest 사용
      this.currentMapKey = 'forest';
      this.mapConfig = MAPS['forest'];
    }

    console.log('✅ Map config loaded:', this.mapConfig.name);
  }

  preload() {
    // ✅ mapConfig가 없으면 에러
    if (!this.mapConfig) {
      console.error('❌ mapConfig is undefined in preload!');
      return;
    }

    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    // 캐릭터 & 적 에셋
    CharacterAssetLoader.preload(this);
    EnemyAssetLoader.preload(this);

    // 포탈 애니메이션 이미지 로드
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  create() {
    // 페이드 인 효과 (씬이 시작될 때)
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.physics.world.gravity.y = this.mapConfig.gravity;
    const mapScale = this.mapConfig.mapScale || 1;

    // 맵 생성 (포탈도 여기서 생성됨)
    const { spawn } = this.mapModel.create();

    // 배경 레이어 생성
    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(this.mapConfig.depths.backgroundStart + index);
    });

    // 플레이어 생성
    this.player = CharacterFactory.create(this, this.selectedCharacter, spawn.x, spawn.y, {
      scale: this.mapConfig.playerScale || 1,
    });
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 맵에 플레이어 추가 (충돌)
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
    if (!this.player) {
      return;
    }

    this.player.update();
    this.mapModel.update(this.player.sprite);

    if (this.enemyManager) {
      this.enemyManager.update(time, delta);
    }

    this.checkAttackCollisions();
  }

  checkAttackCollisions() {
    if (!this.enemyManager) {
      return;
    }

    if (!this.enemyManager.enemies) {
      return;
    }

    if (!this.player) {
      return;
    }

    this.enemyManager.enemies.forEach((enemy, index) => {
      const enemyTarget = enemy.sprite || enemy;

      if (this.player.isAttacking && this.player.isAttacking()) {
        const hit = this.player.checkAttackHit(enemyTarget);

        if (hit && enemy.takeDamage) {
          enemy.takeDamage(10);
        }
      }

      if (this.player.isUsingSkill && this.player.isUsingSkill()) {
        const skillHit = this.player.checkSkillHit(enemy);
        if (skillHit?.hit && enemy.takeDamage) {
          enemy.takeDamage(skillHit.damage);

          if (skillHit.knockback && enemyTarget.body) {
            const facingRight = !this.player.sprite.flipX;
            enemyTarget.body.setVelocityX(
              facingRight ? skillHit.knockback.x : -skillHit.knockback.x,
            );
            enemyTarget.body.setVelocityY(skillHit.knockback.y);
          }
        }
      }
    });
  }
}
