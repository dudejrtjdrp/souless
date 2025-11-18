import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/mapData.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../entities/characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import CharacterSwitchManager from '../systems/CharacterSwitchManager.js';
import InputHandler from '../entities/characters/systems/InputHandler.js';
import CharacterSelectOverlay from '../systems/GameScene/CharacterSelectOverlay.js';
import { EffectLoader } from '../systems/Effects/EffectLoader.js';
import { EffectManager } from '../systems/Effects/EffectManager.js';

import GameSceneInitializer from '../systems/GameScene/GameSceneInitializer.js';
import PlayerSpawnManager from '../systems/GameScene/PlayerSpawnManager.js';
import BackgroundLayerManager from '../systems/GameScene/BackgroundLayerManager.js';
import CharacterSwitchHandler from '../systems/GameScene/CharacterSwitchHandler.js';
import CombatCollisionHandler from '../systems/GameScene/CombatCollisionHandler.js';

import SaveSlotManager from '../utils/SaveSlotManager.js';
import EnemyBase from '../entities/enemies/base/EnemyBase.js'; // 보스 생성용

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.lastSaveTime = 0;
    this.currentBoss = null; // 🎯 보스 인스턴스
  }

  async init(data = {}) {
    await GameSceneInitializer.initializeScene(this, data);
  }

  preload() {
    if (!this.mapConfig) return;

    this.loadMapAssets();
    this.loadCharacterAssets();
    this.loadPortalAssets();
    this.loadBossAssets(); // 🎯 보스 에셋 로드
  }

  loadMapAssets() {
    this.mapModel = new MapModel(this, this.currentMapKey, this.mapConfig, true);
    this.mapModel.preload();

    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });
  }

  loadCharacterAssets() {
    CharacterAssetLoader.preload(this);
    EnemyAssetLoader.preload(this);

    this.effectManager = new EffectManager(this);
    EffectLoader.preloadAllEffects(this);
  }

  loadPortalAssets() {
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  // 🎯 보스 에셋 로드
  loadBossAssets() {
    if (!this.mapConfig.boss?.enabled) return;

    const jobBossMapping = this.mapConfig.boss.jobBossMapping;
    Object.values(jobBossMapping).forEach((bossType) => {
      console.log(`📦 Preloading boss: ${bossType}`);
      EnemyBase.preload(this, bossType);
    });
  }

  async create() {
    await this.initializeUI();
    this.preventTabDefault();
    this.setupInputHandler();
    EffectLoader.createAllAnimations(this);

    const shouldContinue = await this.loadSaveData();
    if (!shouldContinue) {
      return;
    }

    this.setupScene();
    this.createBackground();

    await this.setupPlayer();

    this.setupCamera();
    this.setupEnemies();

    this.setupCharacterSelectUI();
    this.setupBossEvents(); // 🎯 보스 이벤트 설정
    this.emitInitialEvents();

    if (!this.savedSpawnData) {
      this.saveCurrentPosition();
    }

    this.isPortalTransitioning = false;

    this.events.once('shutdown', async () => {
      await this.saveCurrentPosition();
      await this.saveCurrentCharacterResources();
      await SaveSlotManager.immediateBackup();
    });

    this.events.once('pause', async () => {
      await SaveSlotManager.immediateBackup();
    });
  }

  async initializeUI() {
    this.scene.launch('UIScene');
    this.uiScene = this.scene.get('UIScene');
    await GameSceneInitializer.waitForUIReady(this);
  }

  async loadSaveData() {
    if (this.data.get('skipSaveCheck')) {
      this.savedSpawnData = await SaveSlotManager.getSavedPosition();
      if (this.savedSpawnData) {
        this.selectedCharacter = this.savedSpawnData.characterType || 'soul';
      }
      return true;
    }

    const savedPosition = await SaveSlotManager.getSavedPosition();

    if (savedPosition && savedPosition.mapKey !== this.currentMapKey) {
      this.restartWithSavedMap(savedPosition);
      return false;
    }

    this.savedSpawnData = savedPosition;
    if (savedPosition) {
      this.selectedCharacter = savedPosition.characterType || 'soul';
    }

    return true;
  }

  preventTabDefault() {
    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
    });
  }

  restartWithSavedMap(savedPosition) {
    this.scene.start('GameScene', {
      mapKey: savedPosition.mapKey,
      characterType: savedPosition.characterType || 'soul',
      skipSaveCheck: true,
    });
  }

  setupScene() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.physics.world.gravity.y = this.mapConfig.gravity;
  }

  createBackground() {
    const { spawn, portals } = this.mapModel.create();

    this.spawnPosition = this.determineSpawnPosition(spawn, portals);

    const bgManager = new BackgroundLayerManager(this);
    this.backgroundLayers = bgManager.createLayers();
  }

  determineSpawnPosition(defaultSpawn, portals) {
    const spawnManager = new PlayerSpawnManager(this);
    return spawnManager.determineSpawnPosition(defaultSpawn, portals);
  }

  async setupPlayer() {
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);
    this.characterSwitchManager.setCurrentMap(this.currentMapKey);

    this.createPlayer(this.selectedCharacter, this.spawnPosition.x, this.spawnPosition.y);

    if (this.player && this.player.loadSavedResources) {
      await this.player.loadSavedResources();
    }
  }

  setupCamera() {
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);
  }

  setupEnemies() {
    if (!this.player) {
      console.error('❌ Player not found when creating enemies!');
      return;
    }

    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();
  }

  setupCharacterSelectUI() {
    this.characterSelectOverlay = new CharacterSelectOverlay(this);
    this.isBackQuoteHeld = false;
    this.backQuoteHoldStartTime = 0;
  }

  // 🎯 보스 이벤트 설정
  setupBossEvents() {
    this.events.on('bossDefeated', (bossType) => {
      console.log(`🎉 ${bossType} defeated!`);

      // 전직 처리 로직
      if (this.player.nextJob) {
        this.player.changeJob(this.player.nextJob);
        this.showJobChangeEffect();
      }

      // 일반 몬스터 스폰 재개
      if (this.enemyManager) {
        this.enemyManager.resumeSpawning();
      }

      this.currentBoss = null;
    });
  }

  // 🎯 보스 스폰 가능 여부 확인
  canSpawnBoss() {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) return false;
    if (this.currentBoss && !this.currentBoss.isDead) return false;

    if (bossConfig.spawnCondition === 'jobChange') {
      return this.player.isReadyForJobChange && this.player.nextJob;
    }

    return false;
  }

  // 🎯 보스 스폰
  spawnBoss(targetJob) {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) {
      console.warn('⚠️ Boss spawning is not enabled for this map');
      return null;
    }

    const bossType = bossConfig.jobBossMapping[targetJob];

    if (!bossType) {
      console.error(`❌ No boss mapped for job: ${targetJob}`);
      return null;
    }

    console.log(`🎭 Spawning boss: ${bossType} for job: ${targetJob}`);

    const spawnPos = this.calculateBossSpawnPosition();

    this.currentBoss = new EnemyBase(this, spawnPos.x, spawnPos.y, bossType, 1);

    if (this.currentBoss.sprite) {
      const bossDepth = this.mapConfig.depths?.boss || 95;
      this.currentBoss.sprite.setDepth(bossDepth);

      if (this.currentBoss.hpBar) {
        this.currentBoss.hpBar.setScale(2, 1.5);
        this.currentBoss.hpBar.setDepth(bossDepth + 1);
      }
    }

    this.setupBossDeathHandler();
    this.playBossEntrance(bossType);

    // 일반 몬스터 스폰 일시 중지
    if (this.enemyManager) {
      this.enemyManager.pauseSpawning();
    }

    return this.currentBoss;
  }

  // 🎯 보스 스폰 위치 계산
  calculateBossSpawnPosition() {
    const spawnConfig = this.mapConfig.boss.spawnPosition;
    const worldBounds = this.physics.world.bounds;

    let x, y;

    if (spawnConfig.x === 'center') {
      x = worldBounds.width / 2;
    } else if (spawnConfig.x === 'left') {
      x = worldBounds.width * 0.2;
    } else if (spawnConfig.x === 'right') {
      x = worldBounds.width * 0.8;
    } else {
      x = spawnConfig.x;
    }

    if (spawnConfig.y === 'center') {
      y = worldBounds.height / 2;
    } else if (spawnConfig.y === 'top') {
      y = worldBounds.height * 0.3;
    } else if (spawnConfig.y === 'bottom') {
      y = worldBounds.height * 0.7;
    } else {
      y = spawnConfig.y;
    }

    x += spawnConfig.offsetX || 0;
    y += spawnConfig.offsetY || 0;

    return { x, y };
  }

  // 🎯 보스 사망 처리
  setupBossDeathHandler() {
    if (!this.currentBoss) return;

    const originalDestroy = this.currentBoss.destroy.bind(this.currentBoss);

    this.currentBoss.destroy = () => {
      const bossType = this.currentBoss.enemyType;
      this.events.emit('bossDefeated', bossType);
      originalDestroy();
    };
  }

  // 🎯 보스 등장 연출
  playBossEntrance(bossType) {
    this.cameras.main.shake(500, 0.01);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const warningText = this.add
      .text(centerX, centerY - 100, '⚠️ BOSS APPEARED ⚠️', {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.tweens.add({
      targets: warningText,
      alpha: 0,
      y: centerY - 150,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => warningText.destroy(),
    });

    const bossNameText = this.add
      .text(centerX, centerY, bossType.toUpperCase(), {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.tweens.add({
      targets: bossNameText,
      alpha: 0,
      y: centerY + 50,
      duration: 2500,
      delay: 500,
      ease: 'Power2',
      onComplete: () => bossNameText.destroy(),
    });
  }

  // 🎯 전직 완료 연출
  showJobChangeEffect() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const jobText = this.add
      .text(centerX, centerY, `${this.player.nextJob.toUpperCase()} CLASS UNLOCKED!`, {
        fontSize: '36px',
        fontFamily: 'Arial Black',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.tweens.add({
      targets: jobText,
      alpha: 0,
      scale: 1.5,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => jobText.destroy(),
    });
  }

  emitInitialEvents() {
    this.events.emit('character-changed', {
      characterType: this.selectedCharacter,
      player: this.player,
    });

    if (this.uiScene) {
      this.uiScene.handleCharacterChanged({
        characterType: this.selectedCharacter,
        player: this.player,
      });
    }
  }

  createPlayer(characterType, x, y) {
    const finalY = this.calculatePlayerSpawnY(y);

    this.player = CharacterFactory.create(this, characterType, x, finalY, {
      scale: this.mapConfig.playerScale || 1,
    });

    this.player.sprite.setDepth(this.mapConfig.depths.player);
    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    this.setupSwitchCooldown();
  }

  calculatePlayerSpawnY(y) {
    if (!this.savedSpawnData?.physics) {
      return y;
    }

    const offsetY = this.savedSpawnData.physics.offsetY || 100;
    return this.mapModel.config.autoScale ? y : y - offsetY - 35;
  }

  setupSwitchCooldown() {
    this.isCharacterSwitchOnCooldown = true;
    this.time.delayedCall(1800, () => {
      this.isCharacterSwitchOnCooldown = false;
    });
  }

  restorePlayerState(characterType) {
    const savedState = this.characterSwitchManager.loadCharacterState(characterType);
    this.characterSwitchManager.applyStateToCharacter(this.player, savedState, false);
  }

  async switchCharacter(direction = 'next') {
    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchCharacter(direction);

    await SaveSlotManager.updateCurrentCharacter(this.selectedCharacter);
  }

  async switchToSelectedCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchToCharacter(characterType);

    await SaveSlotManager.updateCurrentCharacter(this.selectedCharacter);
  }

  async saveCurrentPosition() {
    if (!this.player?.sprite) return;

    await SaveSlotManager.savePosition(
      this.currentMapKey,
      this.player.sprite.x,
      this.player.sprite.y,
      this.selectedCharacter,
    );
  }

  async onPortalEnter(targetMapKey, portalId) {
    if (this.isPortalTransitioning) return;

    this.isPortalTransitioning = true;

    await this.saveCurrentCharacterResources();

    await SaveSlotManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

    this.cleanupBeforeTransition();
    this.scene.start('GameScene', {
      mapKey: targetMapKey,
      characterType: this.selectedCharacter,
      skipSaveCheck: true,
    });
  }

  async saveCurrentCharacterResources() {
    if (this.player && this.player.saveResources) {
      await this.player.saveResources();
    }
  }

  cleanupBeforeTransition() {
    if (this.playerCollider?.destroy) {
      this.playerCollider.destroy();
      this.playerCollider = null;
    }

    this.player?.destroy();
    this.player = null;

    this.enemyManager?.destroy();
    this.enemyManager = null;

    // 🎯 보스 정리
    if (this.currentBoss) {
      this.currentBoss.destroy();
      this.currentBoss = null;
    }
  }

  onExpGained(amount, characterType) {
    this.events.emit('exp-gained', {
      amount,
      characterType,
    });
  }

  getPlayerStats() {
    return {
      hp: Math.round(this.player.health),
      maxHp: Math.round(this.player.maxHealth),
      mp: Math.round(this.player.mana),
      maxMp: Math.round(this.player.maxMana),
    };
  }

  update(time, delta) {
    if (!this.isPlayerReady()) return;

    this.updateGameObjects(time, delta);
    this.handleInput(time, delta);
    this.emitPlayerEvents();
    this.effectManager.update();
    this.autoSave(time);
  }

  isPlayerReady() {
    return this.player?.sprite?.active && this.inputHandler;
  }

  updateGameObjects(time, delta) {
    this.player.update();
    this.mapModel.update(this.player.sprite);
    this.enemyManager?.update(time, delta);

    // 🎯 보스 업데이트
    if (this.currentBoss && !this.currentBoss.isDead) {
      this.currentBoss.update(time, delta);
    }

    const handler = new CombatCollisionHandler(this);
    this.uiScene.update(time, delta);
    handler.checkAttackCollisions();
  }

  setupInputHandler() {
    this.inputHandler = new InputHandler(this);
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    this.handleCharacterSelectInput(input, time);

    if (input.isTabPressed && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('prev');
    }

    // 🎯 B키로 보스 스폰 (테스트 또는 실제 로직)
    if (input.isBPressed) {
      if (this.canSpawnBoss()) {
        this.spawnBoss(this.player.nextJob || 'warrior');
      } else {
        console.log('⚠️ Cannot spawn boss: conditions not met');
      }
    }

    if (input.isLPressed) {
      this.clearAllSaveData();
    }

    if (input.isDownPressed) {
      this.scene.start('EffectTestScene');
    }
  }

  async openPauseMenu() {
    this.scene.pause();

    await this.saveCurrentPosition();
    await this.saveCurrentCharacterResources();

    this.scene.launch('PauseMenuScene', {
      callingScene: 'GameScene',
    });
  }

  handleCharacterSelectInput(input, time) {
    if (input.isBackQuotePressed) {
      this.isBackQuoteHeld = true;
      this.backQuoteHoldStartTime = time;
    }

    if (input.isBackQuoteHeld && this.isBackQuoteHeld) {
      const holdDuration = time - this.backQuoteHoldStartTime;

      if (holdDuration >= 300 && !this.characterSelectOverlay.isVisible) {
        this.characterSelectOverlay.show();
      }

      if (this.characterSelectOverlay.isVisible) {
        if (input.isLeftPressed) {
          this.characterSelectOverlay.moveSelection('left');
        }
        if (input.isRightPressed) {
          this.characterSelectOverlay.moveSelection('right');
        }
      }
    }

    if (input.isBackQuoteReleased && this.isBackQuoteHeld) {
      this.isBackQuoteHeld = false;

      if (this.characterSelectOverlay.isVisible) {
        const selectedChar = this.characterSelectOverlay.getSelectedCharacter();
        this.characterSelectOverlay.hide();
        this.switchToSelectedCharacter(selectedChar);
      } else {
        if (!this.isCharacterSwitchOnCooldown) {
          this.switchCharacter('next');
        }
      }
    }
  }

  async clearAllSaveData() {
    localStorage.clear();
    await SaveSlotManager.clearAllSlots();
  }

  emitPlayerEvents() {
    this.events.emit('player-stats-updated', this.player);
    this.events.emit('skill-cooldowns-updated', { player: this.player });
  }

  autoSave(time) {
    if (!this.lastSaveTime || time - this.lastSaveTime > 5000) {
      this.lastSaveTime = time;
      this.saveCurrentPosition();
      this.saveCurrentCharacterResources();
      SaveSlotManager.backupCurrentSlot();
    }
  }
}
