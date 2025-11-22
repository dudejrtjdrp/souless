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
import BackgroundLayerManager from '../systems/GameScene/BackgroundLayerManager.js';
import CharacterSwitchHandler from '../systems/GameScene/CharacterSwitchHandler.js';
import CombatCollisionHandler from '../systems/GameScene/CombatCollisionHandler.js';

import SaveSlotManager from '../utils/SaveSlotManager.js';
import EnemyBase from '../entities/enemies/base/EnemyBase.js';

import JobConditionTracker from '../systems/characterType/JobConditionTracker.js';
import JobUnlockManager from '../systems/characterType/JobUnlockManager.js';

import BossEventHandler from '../systems/characterType/BossEventHandler.js';
import LevelSystem from '../entities/characters/systems/LevelSystem.js';

import { KillTracker } from '../systems/KillTracker';
import { PortalConditionManager } from '../systems/PortalConditionManager';
import SoulAbsorb from '../systems/SoulAbsorb.js';

import PlayerSpawnSystem from '../systems/GameScene/PlayerSpawnSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.lastSaveTime = 0;
    this.currentBoss = null;
    this.jobConditionTracker = null;
    this.bossEventHandler = null;
    this.levelSystem = null;
    this.isPlayerDead = false;
    this.spawnSystem = null; // ✅ 추가
  }

  async init(data = {}) {
    await GameSceneInitializer.initializeScene(this, data);
    const currentSlot = SaveSlotManager.getCurrentSlot();
    const slotData = await SaveSlotManager.load(currentSlot);

    if (data.respawningCharacter) {
      this.respawningCharacter = data.respawningCharacter;
      this.respawnHealth = data.respawnHealth || 100;
    }
  }

  preload() {
    if (!this.mapConfig) return;
    this.loadMapAssets();
    this.loadCharacterAssets();
    this.loadPortalAssets();
    this.loadBossAssets();
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
    SoulAbsorb.preload(this);
    this.effectManager = new EffectManager(this);
    EffectLoader.preloadAllEffects(this);
  }

  loadPortalAssets() {
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  loadBossAssets() {
    if (!this.mapConfig.boss?.enabled) return;
    const jobBossMapping = this.mapConfig.boss.jobBossMapping;
    Object.values(jobBossMapping).forEach((bossType) => {
      EnemyBase.preload(this, bossType);
    });
  }

  async create() {
    this.isPlayerDead = false;
    await this.initializeUI();
    await this.ensureSaveSlotInitialized();
    await SaveSlotManager.loadKillData(KillTracker, PortalConditionManager);

    PortalConditionManager.revalidateAllPortals();

    this.preventTabDefault();
    this.setupInputHandler();
    EffectLoader.createAllAnimations(this);

    SoulAbsorb.createAnimations(this);
    this.soulAbsorb = new SoulAbsorb(this);

    const shouldContinue = await this.loadSaveData();
    if (!shouldContinue) return;

    this.setupScene();
    this.createBackground();

    // ✅ 스폰 시스템 사용
    await this.setupPlayer();

    this.setupLevelSystem();

    this.bossEventHandler = new BossEventHandler(this);
    this.bossEventHandler.setupBossEvents();

    this.setupCamera();
    this.setupEnemies();
    this.setupCharacterSelectUI();
    this.emitInitialEvents();
    this.setupJobConditionTracker();

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

  async ensureSaveSlotInitialized() {
    const currentSlot = SaveSlotManager.getCurrentSlot();
    let saveData = await SaveSlotManager.load(currentSlot);

    if (!saveData) {
      saveData = SaveSlotManager.getDefaultSaveData();
      saveData.slotIndex = currentSlot;
      saveData.currentCharacter = this.selectedCharacter || 'soul';
      await SaveSlotManager.save(saveData, currentSlot);
    }
  }

  setupJobConditionTracker() {
    if (this.player) {
      this.jobConditionTracker = new JobConditionTracker(this, this.player);
    }
  }

  async setupLevelSystem() {
    this.levelSystem = new LevelSystem(this);
    await this.levelSystem.load();

    const expData = await SaveSlotManager.getExpData();
    this._characterExpCache = expData.characterExp || {};

    this.events.on('player-level-up', (newLevel) => {
      this.onPlayerLevelUp(newLevel);
    });
  }

  async onExpGained(amount, characterType) {
    if (this.isPlayerDead || (this.player && this.player.health <= 0)) return;
    if (!this.levelSystem) return;

    try {
      const leveledUp = this.levelSystem.addExperienceSync(amount);

      if (!this._characterExpCache) this._characterExpCache = {};
      this._characterExpCache[characterType] =
        (this._characterExpCache[characterType] || 0) + amount;

      const finalCharacterExp = this._characterExpCache[characterType];
      const levelInfo = this.levelSystem.serialize();

      this.events.emit('exp-gained', {
        amount,
        characterType,
        levelInfo: {
          level: levelInfo.level,
          experience: levelInfo.experience,
          experienceToNext: levelInfo.experienceToNext,
          totalExperience: levelInfo.totalExperience,
        },
        characterExp: finalCharacterExp,
      });

      this.saveExpDataBackground(characterType, finalCharacterExp, levelInfo);

      if (leveledUp) {
        console.log(`🎉 레벨업! Lv.${levelInfo.level}`);
      }
    } catch (error) {
      console.error('❌ 경험치 처리 중 오류:', error);
    }
  }

  saveExpDataBackground(characterType, characterExp, levelInfo) {
    Promise.resolve().then(async () => {
      try {
        const currentSlot = SaveSlotManager.getCurrentSlot();
        let saveData = await SaveSlotManager.load(currentSlot);
        if (!saveData) saveData = SaveSlotManager.getDefaultSaveData();

        if (!saveData.characterExp) saveData.characterExp = {};
        saveData.characterExp[characterType] = characterExp;
        saveData.levelSystem = levelInfo;

        await SaveSlotManager.save(saveData, currentSlot);
      } catch (error) {
        console.error('❌ 백그라운드 저장 실패:', error);
      }
    });
  }

  async onPlayerLevelUp(newLevel) {
    if (this.isPlayerDead || (this.player && this.player.health <= 0)) return;

    if (this.player) {
      this.applyLevelUpBonus();
    }

    this.playLevelUpEffect(newLevel);
    await this.levelSystem.save();

    // ✅ 추가: 레벨업 시 포탈 조건 재검사
    await PortalConditionManager.revalidateAllPortals();
  }

  applyLevelUpBonus() {
    if (!this.player) return;

    const newLevel = this.levelSystem.level;
    const isMilestone = newLevel % 10 === 0;

    const healthBonus = isMilestone ? 0.1 : 0.05;
    this.player.maxHealth = Math.floor(this.player.maxHealth * (1 + healthBonus));
    this.player.health = this.player.maxHealth;

    const manaBonus = isMilestone ? 0.1 : 0.03;
    this.player.maxMana = Math.floor(this.player.maxMana * (1 + manaBonus));
    this.player.mana = this.player.maxMana;

    const strengthBonus = isMilestone ? 0.5 : 0.1;
    this.player.addStrength(strengthBonus);

    const defenseBonus = isMilestone ? 0.5 : 0.1;
    this.player.addDefense(defenseBonus);
  }

  playLevelUpEffect(level) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const levelUpText = this.add
      .text(centerX, centerY - 50, `LEVEL UP! ${level}`, {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0);

    this.cameras.main.flash(500, 255, 215, 0);

    this.tweens.add({
      targets: levelUpText,
      alpha: 0,
      y: centerY - 100,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy(),
    });

    if (this.player?.sprite) {
      const particles = this.add.particles(this.player.sprite.x, this.player.sprite.y, 'particle', {
        speed: { min: 100, max: 200 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 20,
        blendMode: 'ADD',
      });
      this.time.delayedCall(1000, () => particles.destroy());
    }
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
    this.mapModel.create();
    const bgManager = new BackgroundLayerManager(this);
    this.backgroundLayers = bgManager.createLayers();
  }

  // ✅ 스폰 시스템 사용
  async setupPlayer() {
    this.spawnSystem = new PlayerSpawnSystem(this);

    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);
    this.characterSwitchManager.setCurrentMap(this.currentMapKey);

    // 스폰 시스템으로 플레이어 생성
    this.player = this.spawnSystem.createPlayer(this.selectedCharacter, {
      isRespawn: !!this.respawningCharacter,
      respawnHealth: this.respawnHealth || 100,
    });

    // ✅ 리스폰 시 상태 확실히 초기화
    if (this.respawningCharacter) {
      this.player.isDying = false;
      this.isPlayerDead = false;

      // ✅ 리스폰 시 HP 강제 복원
      this.player.health = this.respawnHealth || this.player.maxHealth;
      this.player.mana = this.player.maxMana;

      if (this.player.stateMachine) {
        this.player.stateMachine.unlock();
        this.player.stateMachine.changeState('idle');
      }
    } else {
      // ✅ 일반 로드 시에도 HP가 0이면 초기화
      if (this.player?.loadSavedResources) {
        await this.player.loadSavedResources();
      }

      // ✅ 로드 후에도 HP가 너무 낮으면 최소값 보장
      if (this.player.health < 10) {
        this.player.health = Math.floor(this.player.maxHealth * 0.1);
      }
    }

    this.respawningCharacter = null;
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

  canSpawnBoss() {
    const bossConfig = this.mapConfig.boss;
    if (!bossConfig?.enabled) return false;
    if (this.isBossSpawning) return false;
    if (this.currentBoss && !this.currentBoss.isDead) return false;
    return true;
  }

  async spawnBoss(targetJob = null) {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) return null;
    if (this.isBossSpawning) return null;

    this.isBossSpawning = true;

    try {
      if (!targetJob) {
        targetJob = await JobUnlockManager.getNextJobBoss();
      }

      const canChallenge = await JobUnlockManager.canJobChange(targetJob);
      if (!canChallenge) return null;

      const bossType =
        bossConfig.jobBossMapping[targetJob] || JobUnlockManager.getBossTypeFromJob(targetJob);
      if (!bossType) return null;

      const spawnPos = this.calculateBossSpawnPosition();
      const colliderTop = this.physics.world.bounds.height - 200;

      this.currentBoss = new EnemyBase(this, spawnPos.x, colliderTop, bossType, 1);

      if (this.currentBoss.sprite) {
        const bossDepth = this.mapConfig.depths?.boss || 95;
        this.currentBoss.sprite.setDepth(bossDepth);

        if (this.currentBoss.hpBar) {
          this.currentBoss.hpBar.setScale(2, 1.5);
          this.currentBoss.hpBar.setDepth(bossDepth + 1);
        }

        if (this.mapModel?.addEnemy) {
          this.mapModel.addEnemy(this.currentBoss.sprite);
        }
      }

      this.setupBossDeathHandler();
      this.playBossEntrance(bossType);

      if (this.enemyManager) {
        this.enemyManager.pauseSpawning();
      }

      return this.currentBoss;
    } finally {
      this.isBossSpawning = false;
    }
  }

  calculateBossSpawnPosition() {
    const spawnConfig = this.mapConfig.boss.spawnPosition;
    const worldBounds = this.physics.world.bounds;

    let x, y;

    if (spawnConfig.x === 'center') x = worldBounds.width / 2;
    else if (spawnConfig.x === 'left') x = worldBounds.width * 0.2;
    else if (spawnConfig.x === 'right') x = worldBounds.width * 0.8;
    else x = spawnConfig.x;

    if (spawnConfig.y === 'center') y = worldBounds.height / 2;
    else if (spawnConfig.y === 'top') y = worldBounds.height * 0.3;
    else if (spawnConfig.y === 'bottom') y = worldBounds.height * 0.7;
    else y = spawnConfig.y;

    x += spawnConfig.offsetX || 0;
    y += spawnConfig.offsetY || 0;

    return { x, y };
  }

  setupBossDeathHandler() {
    if (!this.currentBoss) return;

    const boss = this.currentBoss;
    const originalDestroy = boss.destroy.bind(boss);
    const bossType = boss.enemyType;

    boss.destroy = () => {
      // ... 기존 코드 ...

      this.events.emit('bossDefeated', bossType);

      // ✅ 추가: 보스 처치 기록
      PortalConditionManager.recordBossDefeat(bossType);
      if (this.enemyManager?.enemies) {
        const index = this.enemyManager.enemies.indexOf(boss);
        if (index > -1) this.enemyManager.enemies.splice(index, 1);
      }

      if (this.currentBoss === boss) {
        this.currentBoss = null;
      }

      originalDestroy();
    };
  }

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

  // ✅ 스폰 시스템 사용
  async switchToSelectedCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    if (this.levelSystem) await this.levelSystem.save();
    await this.saveCurrentCharacterResources();

    const currentX = this.player?.sprite?.x || 0;
    this.player?.destroy();

    // 스폰 시스템으로 새 캐릭터 생성
    this.player = this.spawnSystem.createPlayerForSwitch(characterType, currentX);

    if (this.player?.loadSavedResources) {
      await this.player.loadSavedResources();
    }

    this.selectedCharacter = characterType;
    this.characterSwitchManager.setCurrentCharacterType(characterType);

    this.setupCamera();

    this.levelSystem = new LevelSystem(this);
    await this.levelSystem.load();
    await SaveSlotManager.updateCurrentCharacter(this.selectedCharacter);

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

  async switchCharacter(direction = 'next') {
    if (this.levelSystem) await this.levelSystem.save();
    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchCharacter(direction);

    this.levelSystem = new LevelSystem(this);
    await this.levelSystem.load();
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
    if (this.isPortalTransitioning || this.isPlayerDead) return;

    this.isPortalTransitioning = true;

    if (this.levelSystem) await this.levelSystem.save();
    await this.saveCurrentCharacterResources();
    await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);
    await SaveSlotManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

    this.cleanupBeforeTransition();
    await SaveSlotManager.updateCurrentCharacter(this.selectedCharacter);

    this.scene.start('GameScene', {
      mapKey: targetMapKey,
      characterType: this.selectedCharacter,
      skipSaveCheck: true,
    });
  }

  async saveCurrentCharacterResources() {
    if (this.player?.saveResources) {
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

    this.jobConditionTracker?.destroy();
    this.jobConditionTracker = null;

    this.currentBoss?.destroy();
    this.currentBoss = null;

    this.bossEventHandler?.destroy();
    this.bossEventHandler = null;

    this.levelSystem?.destroy();
    this.levelSystem = null;

    this.isBossSpawning = false;
  }

  getPlayerStats() {
    return {
      hp: Math.round(this.player.health),
      maxHp: Math.round(this.player.maxHealth),
      mp: Math.round(this.player.mana),
      maxMp: Math.round(this.player.maxMana),
    };
  }

  async update(time, delta) {
    if (!this.isPlayerReady()) return;

    // ✅ 사망 체크를 먼저 처리
    if (this.player && this.player.health <= 0 && !this.isPlayerDead && !this.player.isDying) {
      // 사망 처리 시작
      this.player.onDeath();
      return;
    }

    // ✅ 사망 중이면 업데이트 중단
    if (this.isPlayerDead || (this.player && this.player.isDying)) {
      return;
    }

    if (this.jobConditionTracker) {
      this.jobConditionTracker.update(time);
    }

    this.updateGameObjects(time, delta);
    this.handleInput(time, delta);
    this.emitPlayerEvents();
    this.effectManager.update();
    await this.autoSave(time);
  }

  isPlayerReady() {
    return this.player?.sprite?.active && this.inputHandler;
  }

  async updateGameObjects(time, delta) {
    this.player.update();
    this.mapModel.update(this.player.sprite);
    this.enemyManager?.update(time, delta);

    if (this.currentBoss && !this.currentBoss.isDead) {
      this.currentBoss.update(time, delta);
    }

    const handler = new CombatCollisionHandler(this);
    this.uiScene.update(time, delta);
    await handler.checkAttackCollisions();
  }

  setupInputHandler() {
    this.inputHandler = new InputHandler(this);
  }

  async openPauseMenu() {
    this.scene.pause();
    await this.saveCurrentPosition();
    await this.saveCurrentCharacterResources();

    this.scene.launch('PauseMenuScene', {
      callingScene: 'GameScene',
    });
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    this.handleCharacterSelectInput(input, time);

    if (input.isBPressed) {
      if (this.canSpawnBoss()) {
        this.spawnBoss().catch((err) => console.error('Error spawning boss:', err));
      }
    }

    if (input.isLPressed) {
      this.clearAllSaveData();
    }

    if (input.isDownPressed) {
      this.scene.start('EffectTestScene');
    }
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
        if (input.isLeftPressed) this.characterSelectOverlay.moveSelection('left');
        if (input.isRightPressed) this.characterSelectOverlay.moveSelection('right');
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

  async autoSave(time) {
    if (this.isPlayerDead) return;
    if (!this.lastSaveTime || time - this.lastSaveTime > 5000) {
      this.lastSaveTime = time;
      this.saveCurrentPosition();
      this.saveCurrentCharacterResources();

      if (this.levelSystem) await this.levelSystem.save();
      await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);
      SaveSlotManager.backupCurrentSlot();
    }
  }

  onAttack() {
    this.scene.events.emit('player-attack');
  }

  onHit() {
    this.scene.events.emit('player-hit');
  }

  takeDamage(amount) {
    this.scene.events.emit('player-damaged');
  }

  setDeath(isDeath) {
    console.log(isDeath);
    this.isPlayerDead = isDeath;
  }
}
