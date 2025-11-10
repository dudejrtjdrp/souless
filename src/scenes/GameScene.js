import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/mapData.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import CharacterSwitchManager from '../systems/CharacterSwitchManager.js';
import SaveManager from '../utils/SaveManager.js';
import { PortalManager } from '../config/portalData.js';
import InputHandler from '../characters/systems/InputHandler.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data = {}) {
    this.isPortalTransitioning = false;
    this.currentMapKey = data.mapKey || 'forest';
    this.selectedCharacter = data.characterType || 'assassin';
    this.data.set('skipSaveCheck', data.skipSaveCheck || false);

    this.mapConfig = MAPS[this.currentMapKey];

    if (!this.mapConfig) {
      console.error(`❌ Map config not found for key: "${this.currentMapKey}"`);
      console.log('Available maps:', Object.keys(MAPS));
      this.currentMapKey = 'forest';
      this.mapConfig = MAPS['forest'];
    }
  }

  preload() {
    if (!this.mapConfig) {
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

  async create() {
    this.scene.launch('UIScene');
    this.uiScene = this.scene.get('UIScene');

    // ✅ UIScene의 create()가 완료될 때까지 대기
    await new Promise((resolve) => {
      if (this.uiScene.expBar && this.uiScene.healthMana) {
        resolve();
      } else {
        this.uiScene.events.once('create', () => {
          console.log('✅ UIScene create 완료');
          resolve();
        });
      }
    });

    console.log('🎮 GameScene create 시작');

    this.inputHandler = new InputHandler(this);

    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
    });

    // 세이브 파일 체크
    if (!this.data || !this.data.get('skipSaveCheck')) {
      const savedPosition = await SaveManager.getSavedPosition();
      console.log(await SaveManager.load());

      if (savedPosition && savedPosition.mapKey !== this.currentMapKey) {
        this.scene.start('GameScene', {
          mapKey: savedPosition.mapKey,
          characterType: savedPosition.characterType || 'assassin',
          skipSaveCheck: true,
        });
        return;
      }

      if (savedPosition) {
        this.savedSpawnData = savedPosition;
        this.selectedCharacter = savedPosition.characterType || 'assassin';
        console.log('📂 Loaded from save:', savedPosition);
      } else {
        this.savedSpawnData = null;
        console.log('🆕 New game - will spawn at first portal');
      }
    } else {
      const savedPosition = await SaveManager.getSavedPosition();
      if (savedPosition) {
        this.savedSpawnData = savedPosition;
        this.selectedCharacter = savedPosition.characterType || 'assassin';
      }
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.physics.world.gravity.y = this.mapConfig.gravity;

    const { spawn, portals } = this.mapModel.create();
    const spawnPosition = this.determineSpawnPosition(spawn, portals);

    // 레이어 생성
    if (this.mapConfig.layers && this.mapConfig.layers.length > 0) {
      const autoScale = this.mapModel.config.autoScale;
      const mapScale = this.mapConfig.mapScale || 1;

      this.mapConfig.layers.forEach((layer, index) => {
        const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
        if (autoScale) {
          img.setScale(autoScale);
        } else {
          img.setScale(mapScale);
        }
        img.setDepth(this.mapConfig.depths.backgroundStart + index);
      });
    }

    // 캐릭터 전환 매니저 초기화
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);

    // 플레이어 생성
    this.spawnPosition = spawnPosition;
    this.createPlayer(this.selectedCharacter, spawnPosition.x, spawnPosition.y);

    // 카메라 설정
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);

    // 적 매니저 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();

    // UI 텍스트 추가
    this.createSwitchUI();

    // ✅ UIScene 초기 업데이트
    if (this.uiScene) {
      // 현재 캐릭터 타입 설정
      this.uiScene.currentCharacterType = this.selectedCharacter;

      this.uiScene.updateUI(this.player);
      await this.uiScene.updateExpBars();

      if (this.player) {
        await this.uiScene.restoreSkillCooldowns(this.selectedCharacter, this.player);
      }
    }

    // 초기 위치 저장
    if (!this.savedSpawnData) {
      this.saveCurrentPosition();
    }
  }

  determineSpawnPosition(defaultSpawn, portals) {
    let rawPosition = null;

    if (!this.savedSpawnData) {
      const firstPortalConfig = PortalManager.getPortalsByMap(this.currentMapKey)[0];

      if (firstPortalConfig) {
        rawPosition = {
          x: firstPortalConfig.sourcePosition.x,
          y: firstPortalConfig.sourcePosition.y,
        };
      } else {
        rawPosition = defaultSpawn;
      }
    } else if (this.savedSpawnData.fromPortal && this.savedSpawnData.portalId) {
      const targetPortal = PortalManager.getPortal(this.savedSpawnData.portalId);

      if (targetPortal && targetPortal.sourceMap === this.currentMapKey) {
        console.log('🌀 Spawning at portal:', targetPortal);
        rawPosition = {
          x: targetPortal.sourcePosition.x,
          y: targetPortal.sourcePosition.y,
        };
      } else {
        console.warn('⚠️ Portal not found, using default spawn');
        rawPosition = defaultSpawn;
      }
    } else if (this.savedSpawnData.x !== undefined && this.savedSpawnData.y !== undefined) {
      console.log('📍 Spawning at saved position:', this.savedSpawnData);
      rawPosition = { x: this.savedSpawnData.x, y: this.savedSpawnData.y };
    } else {
      console.log('📍 Spawning at default spawn');
      rawPosition = defaultSpawn;
    }

    if (this.mapModel.config.autoScale && rawPosition) {
      const groundY = this.mapModel.getGroundY();
      if (rawPosition.y >= groundY - 100) {
        const adjustedY = groundY - 150;
        console.log(`✅ Adjusted spawn Y: ${rawPosition.y} → ${adjustedY} (ground: ${groundY})`);
        rawPosition.y = adjustedY;
      }
    }

    return rawPosition;
  }

  async saveCurrentPosition() {
    if (!this.player || !this.player.sprite) return;

    await SaveManager.savePosition(
      this.currentMapKey,
      this.player.sprite.x,
      this.player.sprite.y,
      this.selectedCharacter,
    );
  }

  async onPortalEnter(targetMapKey, portalId) {
    console.log(targetMapKey);
    if (this.isPortalTransitioning) {
      return;
    }

    this.isPortalTransitioning = true;

    await SaveManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

    if (this.player) {
      if (this.playerCollider && this.playerCollider.destroy) {
        this.playerCollider.destroy();
        this.playerCollider = null;
      }
      this.player.destroy();
      this.player = null;
    }

    if (this.enemyManager) {
      this.enemyManager.destroy();
      this.enemyManager = null;
    }

    console.log(targetMapKey);
    this.scene.start('GameScene', {
      mapKey: targetMapKey,
      characterType: this.selectedCharacter,
      skipSaveCheck: true,
    });
  }

  createPlayer(characterType, x, y, restoreState = false) {
    let finalY = y;

    if (this.savedSpawnData && this.savedSpawnData['physics']) {
      const offsetY = this.savedSpawnData['physics'].offsetY || 100;
      if (!this.mapModel.config.autoScale) {
        finalY = y - offsetY - 35;
      }
    }

    this.player = CharacterFactory.create(this, characterType, x, finalY, {
      scale: this.mapConfig.playerScale || 1,
    });
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    this.isCharacterSwitchOnCooldown = true;
    this.time.delayedCall(1800, () => {
      this.isCharacterSwitchOnCooldown = false;
    });

    if (restoreState) {
      const savedState = this.characterSwitchManager.loadCharacterState(characterType);
      this.characterSwitchManager.applyStateToCharacter(this.player, savedState, false);
    }
  }

  async switchCharacter(direction = 'next') {
    if (this.characterSwitchManager.isTransitioning) {
      console.log('⏳ Already transitioning...');
      return;
    }

    await this.saveCurrentPosition();

    if (this.uiScene && this.player) {
      await this.uiScene.saveCurrentCooldowns(this.selectedCharacter, this.player);
    }

    this.characterSwitchManager.saveCurrentCharacterState(this.player);

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

    const currentPos = {
      x: this.player.sprite.x,
      y: this.player.sprite.y,
    };
    const currentVelocity = {
      x: this.player.sprite.body.velocity.x,
      y: this.player.sprite.body.velocity.y,
    };
    const facingRight = !this.player.sprite.flipX;

    this.cameras.main.flash(200, 255, 255, 255);

    if (this.player) {
      if (this.playerCollider && this.playerCollider.destroy) {
        this.playerCollider.destroy();
        this.playerCollider = null;
      }
      this.player.destroy();
      this.player = null;
    }

    this.time.delayedCall(100, async () => {
      this.selectedCharacter = nextCharacterType;
      this.characterSwitchManager.setCurrentCharacterType(nextCharacterType);

      this.createPlayer(nextCharacterType, currentPos.x, currentPos.y);

      this.player.sprite.body.setVelocity(currentVelocity.x, currentVelocity.y);
      this.player.sprite.setFlipX(!facingRight);

      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

      if (this.enemyManager) {
        this.enemyManager.player = this.player;
      }

      // ✅ UIScene에 캐릭터 전환 이벤트 발행
      if (this.uiScene) {
        this.uiScene.currentCharacterType = nextCharacterType;
        await this.uiScene.updateExpBars();
        await this.uiScene.restoreSkillCooldowns(nextCharacterType, this.player);

        // 🎨 스킬 아이콘 업데이트
        const { CharacterData } = await import('../config/CharacterData.js');
        const characterData = CharacterData[nextCharacterType];
        if (characterData && this.uiScene.skillCooldownUI) {
          this.uiScene.skillCooldownUI.updateSkillIcons(characterData);
        }
      }

      this.updateSwitchUI();

      this.characterSwitchManager.setTransitioning(false);
      console.log(`✅ Switched to ${nextCharacterType}`);

      await this.saveCurrentPosition();

      this.characterSwitchManager.debugPrintStates();
    });
  }

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

  updateSwitchUI() {
    if (this.switchText && this.player) {
      const hp = Math.round(this.player.health);
      const maxHp = Math.round(this.player.maxHealth);
      const mp = Math.round(this.player.mana);
      const maxMp = Math.round(this.player.maxMana);

      this.switchText.setText([
        `Character: ${this.selectedCharacter.toUpperCase()}`,
        `HP: ${hp}/${maxHp} | MP: ${mp}/${maxMp}`,
        `Press \` to switch | Map: ${this.currentMapKey}`,
      ]);
    }
  }

  update(time, delta) {
    if (!this.player || !this.player.sprite || !this.player.sprite.active) {
      return;
    }

    if (!this.inputHandler) {
      return;
    }

    this.player.update();
    this.mapModel.update(this.player.sprite);

    if (this.enemyManager) {
      this.enemyManager.update(time, delta);
    }

    this.checkAttackCollisions();

    if (this.switchText && time % 100 < delta) {
      this.updateSwitchUI();
    }

    if (this.uiScene && this.player) {
      this.uiScene.updateUI(this.player);
      this.uiScene.updateSkillCooldowns(this.player);
    }

    const input = this.inputHandler.getInputState();

    if (input.isBackQuotePressed && !this.isCharacterSwitchOnCooldown) {
      console.log('🔄 Switching to next character...');
      this.switchCharacter('next');
    }

    if (input.isTabPressed && !this.isCharacterSwitchOnCooldown) {
      console.log('🔄 Switching to prev character...');
      this.switchCharacter('prev');
    }

    if (input.isLPressed) {
      localStorage.clear();
      SaveManager.clear();
      if (this.switchText) {
        this.switchText.setText('🗑 All save data cleared! Reload the page.');
      }
    }

    if (!this.lastSaveTime || time - this.lastSaveTime > 5000) {
      this.lastSaveTime = time;
      this.saveCurrentPosition();
    }
  }

  checkAttackCollisions() {
    if (!this.enemyManager || !this.enemyManager.enemies || !this.player) {
      return;
    }

    this.enemyManager.enemies.forEach((enemy) => {
      const enemyTarget = enemy.sprite || enemy;

      // 기본 공격
      if (this.player.isAttacking && this.player.isAttacking()) {
        const hit = this.player.checkAttackHit(enemyTarget);
        if (hit && enemy.takeDamage) {
          const died = enemy.takeDamage(10);

          // ✅ 적이 죽으면 플레이어가 경험치 획득
          if (died && enemy.expReward) {
            this.player.gainExp(enemy.expReward);
          }
        }
      }

      // 스킬 공격
      if (this.player.isUsingSkill && this.player.isUsingSkill()) {
        const skillHit = this.player.checkSkillHit(enemy);
        if (skillHit?.hit && enemy.takeDamage) {
          const died = enemy.takeDamage(skillHit.damage);

          // ✅ 적이 죽으면 플레이어가 경험치 획득
          if (died && enemy.expReward) {
            this.player.gainExp(enemy.expReward);
          }

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
