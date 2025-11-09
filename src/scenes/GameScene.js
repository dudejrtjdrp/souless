import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/mapData.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import CharacterSwitchManager from '../systems/CharacterSwitchManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data = {}) {
    this.currentMapKey = data.mapKey || 'forest';
    this.selectedCharacter = data.characterType || 'assassin';

    console.log('🎮 GameScene init:', {
      mapKey: this.currentMapKey,
      character: this.selectedCharacter,
    });

    this.mapConfig = MAPS[this.currentMapKey];

    if (!this.mapConfig) {
      console.error(`❌ Map config not found for key: "${this.currentMapKey}"`);
      console.log('Available maps:', Object.keys(MAPS));
      this.currentMapKey = 'forest';
      this.mapConfig = MAPS['forest'];
    }

    console.log('✅ Map config loaded:', this.mapConfig.name);
  }

  preload() {
    if (!this.mapConfig) {
      console.error('❌ mapConfig is undefined in preload!');
      return;
    }

    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    CharacterAssetLoader.preload(this);
    EnemyAssetLoader.preload(this);

    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.physics.world.gravity.y = this.mapConfig.gravity;
    const mapScale = this.mapConfig.mapScale || 1;

    const { spawn } = this.mapModel.create();
    console.log(spawn);

    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(this.mapConfig.depths.backgroundStart + index);
    });

    // ✅ 캐릭터 전환 매니저 초기화
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);

    // 플레이어 생성
    this.spawnPosition = spawn; // 스폰 위치 저장
    this.createPlayer(this.selectedCharacter, spawn.x, spawn.y);

    // 카메라 설정
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);

    // 적 매니저 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();

    // ✅ 캐릭터 전환 키 입력 설정
    this.setupCharacterSwitchInput();

    // ✅ UI 텍스트 추가 (선택사항)
    this.createSwitchUI();
  }

  /**
   * 플레이어 캐릭터 생성
   */
  createPlayer(characterType, x, y, restoreState = false) {
    this.player = CharacterFactory.create(this, characterType, x, y, {
      scale: this.mapConfig.playerScale || 1,
    });
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 플레이어 collider 생성 및 저장
    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    // 저장된 상태 복원 (체력, 마나, 스킬 쿨타임만)
    if (restoreState) {
      const savedState = this.characterSwitchManager.loadCharacterState(characterType);
      // 위치는 제외하고 상태만 복원
      this.characterSwitchManager.applyStateToCharacter(this.player, savedState, false);
    }
  }

  /**
   * 캐릭터 전환 키 입력 설정
   */
  setupCharacterSwitchInput() {
    // ` (백틱) 키로 다음 캐릭터
    this.input.keyboard.on('keydown-BACK_QUOTE', () => {
      this.switchCharacter('next');
    });

    // Tab 키로 이전 캐릭터 (선택사항)
    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault(); // 브라우저 기본 동작 방지
      this.switchCharacter('prev');
    });
  }

  /**
   * 캐릭터 전환 실행
   */
  switchCharacter(direction = 'next') {
    if (this.characterSwitchManager.isTransitioning) {
      console.log('⏳ Already transitioning...');
      return;
    }

    // 현재 상태 저장
    this.characterSwitchManager.saveCurrentCharacterState(this.player);

    // 다음/이전 캐릭터 타입 결정
    const nextCharacterType =
      direction === 'next'
        ? this.characterSwitchManager.switchToNextCharacter()
        : this.characterSwitchManager.switchToPreviousCharacter();

    if (!nextCharacterType) {
      console.error('❌ No next character type found');
      return;
    }

    console.log(`🔄 Switching from ${this.selectedCharacter} to ${nextCharacterType}`);

    this.characterSwitchManager.setTransitioning(true);

    // 현재 위치와 속도 저장
    const currentPos = {
      x: this.player.sprite.x,
      y: this.player.sprite.y,
    };
    const currentVelocity = {
      x: this.player.sprite.body.velocity.x,
      y: this.player.sprite.body.velocity.y,
    };
    const facingRight = !this.player.sprite.flipX;

    // 전환 이펙트 (페이드 아웃/인)
    this.cameras.main.flash(200, 255, 255, 255);

    // 기존 플레이어 제거
    if (this.player) {
      // 플레이어의 collider만 제거 (적들의 collider는 유지)
      if (this.playerCollider && this.playerCollider.destroy) {
        this.playerCollider.destroy();
        this.playerCollider = null;
      }
      this.player.destroy();
      this.player = null;
    }

    // 새 캐릭터 생성
    this.time.delayedCall(100, () => {
      this.selectedCharacter = nextCharacterType;
      this.characterSwitchManager.setCurrentCharacterType(nextCharacterType);

      // 새 플레이어 생성 (같은 위치)
      this.createPlayer(nextCharacterType, currentPos.x, currentPos.y);

      // 속도와 방향 복원
      this.player.sprite.body.setVelocity(currentVelocity.x, currentVelocity.y);
      this.player.sprite.setFlipX(!facingRight);

      // 카메라 재연결
      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

      // 적 매니저 플레이어 참조 업데이트
      if (this.enemyManager) {
        this.enemyManager.player = this.player;
      }

      // UI 업데이트
      this.updateSwitchUI();

      this.characterSwitchManager.setTransitioning(false);
      console.log(`✅ Switched to ${nextCharacterType}`);

      // 디버그: 저장된 상태 출력
      this.characterSwitchManager.debugPrintStates();
    });
  }

  /**
   * 전환 UI 생성 (선택사항)
   */
  createSwitchUI() {
    this.switchText = this.add
      .text(16, 16, '', {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.updateSwitchUI();
  }

  /**
   * UI 텍스트 업데이트
   */
  updateSwitchUI() {
    if (this.switchText && this.player) {
      const hp = Math.round(this.player.health);
      const maxHp = Math.round(this.player.maxHealth);
      const mp = Math.round(this.player.mana);
      const maxMp = Math.round(this.player.maxMana);

      this.switchText.setText([
        `Character: ${this.selectedCharacter.toUpperCase()}`,
        `HP: ${hp}/${maxHp} | MP: ${mp}/${maxMp}`,
        `Press \` to switch`,
      ]);
    }
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

    // UI 업데이트 (체력/마나 변화 반영)
    if (this.switchText && time % 100 < delta) {
      this.updateSwitchUI();
    }
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
