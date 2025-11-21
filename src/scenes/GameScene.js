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

import JobConditionTracker from '../systems/characterType/JobConditionTracker.js';
import JobUnlockManager from '../systems/characterType/JobUnlockManager.js';

import BossEventHandler from '../systems/characterType/BossEventHandler.js';
import LevelSystem from '../entities/characters/systems/LevelSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.lastSaveTime = 0;
    this.currentBoss = null;
    this.jobConditionTracker = null;
    this.bossEventHandler = null;
    // this.isBossSpawning = false;
    this.levelSystem = null;
  }

  async init(data = {}) {
    await GameSceneInitializer.initializeScene(this, data);
    const currentSlot = SaveSlotManager.getCurrentSlot();

    const slotData = await SaveSlotManager.load(currentSlot);
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
      EnemyBase.preload(this, bossType);
    });
  }

  async create() {
    await this.initializeUI();
    await this.ensureSaveSlotInitialized();
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
    this.setupLevelSystem(); // 플레이어 생성 후 호출

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
      console.warn(`⚠️ 슬롯 ${currentSlot}이 비어있습니다. 초기 데이터 생성...`);

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

    // 캐릭터 경험치 캐시 로드
    const expData = await SaveSlotManager.getExpData();
    this._characterExpCache = expData.characterExp || {};

    this.events.on('player-level-up', (newLevel) => {
      this.onPlayerLevelUp(newLevel);
    });

    console.log(`✅ 레벨 시스템 초기화 완료: Lv.${this.levelSystem.level}`);
  }

  async onExpGained(amount, characterType) {
    if (!this.levelSystem) return;

    try {
      // ✅ 1. 메모리에서 즉시 경험치 추가 (await 제거!)
      const leveledUp = this.levelSystem.addExperienceSync(amount);

      // ✅ 2. 캐릭터별 경험치도 메모리에서 즉시 계산
      if (!this._characterExpCache) this._characterExpCache = {};
      this._characterExpCache[characterType] =
        (this._characterExpCache[characterType] || 0) + amount;

      const finalCharacterExp = this._characterExpCache[characterType];
      const levelInfo = this.levelSystem.serialize();

      // ✅ 3. UI 즉시 업데이트 (await 없음!)
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

      // ✅ 4. 저장은 백그라운드에서 (UI 블로킹 없음)
      this.saveExpDataBackground(characterType, finalCharacterExp, levelInfo);

      if (leveledUp) {
        console.log(`🎉 레벨업! Lv.${levelInfo.level}`);
      }
    } catch (error) {
      console.error('❌ 경험치 처리 중 오류:', error);
    }
  }

  saveExpDataBackground(characterType, characterExp, levelInfo) {
    // Promise로 감싸서 백그라운드 실행
    Promise.resolve().then(async () => {
      try {
        const currentSlot = SaveSlotManager.getCurrentSlot();
        let saveData = await SaveSlotManager.load(currentSlot);

        if (!saveData) {
          saveData = SaveSlotManager.getDefaultSaveData();
        }

        // 캐릭터 경험치 업데이트
        if (!saveData.characterExp) saveData.characterExp = {};
        saveData.characterExp[characterType] = characterExp;

        // 레벨 시스템 업데이트
        saveData.levelSystem = levelInfo;

        // 저장
        await SaveSlotManager.save(saveData, currentSlot);
      } catch (error) {
        console.error('❌ 백그라운드 저장 실패:', error);
      }
    });
  }

  // 레벨업 콜백
  async onPlayerLevelUp(newLevel) {
    // 플레이어 스탯 증가
    if (this.player) {
      this.applyLevelUpBonus();
    }

    // 레벨업 연출
    this.playLevelUpEffect(newLevel);

    // 레벨 데이터 저장
    await this.levelSystem.save();

    // JobConditionTracker가 'player-level-up' 이벤트를 듣고 있음
  }

  /**
   * 레벨업 시 플레이어 스탯 증가
   */
  applyLevelUpBonus() {
    if (!this.player) return;

    // 레벨업 시 스탯 증가 예시
    this.player.maxHealth += 10;
    this.player.health = this.player.maxHealth; // 체력 회복
    this.player.maxMana += 5;
    this.player.mana = this.player.maxMana; // 마나 회복

    // 공격력 증가 (캐릭터 config에 따라)
    if (this.player.config) {
      this.player.config.attackDamage = (this.player.config.attackDamage || 10) + 2;
    }

    this.events.emit('player-stats-updated', this.player);
  }

  /**
   * 레벨업 연출
   */
  playLevelUpEffect(level) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // 레벨업 텍스트
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

    // 카메라 플래시
    this.cameras.main.flash(500, 255, 215, 0);

    // 애니메이션
    this.tweens.add({
      targets: levelUpText,
      alpha: 0,
      y: centerY - 100,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy(),
    });

    // 파티클 효과 (선택사항)
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

  // 🎯 보스 스폰 가능 여부 확인
  canSpawnBoss() {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) return false;
    if (this.isBossSpawning) return false; // Prevent spawning while already spawning
    if (this.currentBoss && !this.currentBoss.isDead) return false;

    return true;
  }

  // 🎯 보스 스폰
  async spawnBoss(targetJob = null) {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) {
      console.warn('⚠️ Boss spawning is not enabled for this map');
      return null;
    }

    if (this.isBossSpawning) {
      console.warn('⚠️ Boss is already spawning');
      return null;
    }

    this.isBossSpawning = true;

    try {
      // targetJob이 없으면 다음 가능한 보스 선택
      if (!targetJob) {
        targetJob = await JobUnlockManager.getNextJobBoss();
      }

      // 보스 도전 가능 여부 확인
      const canChallenge = await JobUnlockManager.canJobChange(targetJob);

      if (!canChallenge) {
        console.warn(`⚠️ Cannot challenge boss for ${targetJob}`);
        return null;
      }

      const bossType =
        bossConfig.jobBossMapping[targetJob] || JobUnlockManager.getBossTypeFromJob(targetJob);

      if (!bossType) {
        console.error(`❌ No boss mapped for job: ${targetJob}`);
        return null;
      }

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

        if (this.mapModel && this.mapModel.addEnemy) {
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

  // 보스 사망 처리
  setupBossDeathHandler() {
    if (!this.currentBoss) return;

    const boss = this.currentBoss;
    const originalDestroy = boss.destroy.bind(boss);
    const bossType = boss.enemyType;

    boss.destroy = () => {
      if (this.enemyManager && this.enemyManager.enemies) {
        const index = this.enemyManager.enemies.indexOf(boss);
        if (index > -1) {
          this.enemyManager.enemies.splice(index, 1);
        }
      }

      this.events.emit('bossDefeated', bossType);

      if (this.currentBoss === boss) {
        this.currentBoss = null;
      }

      originalDestroy();
    };
  }

  // 보스 등장 연출
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

  // 전직 완료 연출
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
    // 현재 캐릭터의 경험치 데이터 저장
    if (this.levelSystem) {
      await this.levelSystem.save();
    }

    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchCharacter(direction);

    // 새 캐릭터의 레벨 데이터 로드
    this.levelSystem = new LevelSystem(this);
    await this.levelSystem.load();

    await SaveSlotManager.updateCurrentCharacter(this.selectedCharacter);
  }

  async switchToSelectedCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    // 현재 캐릭터의 경험치 데이터 저장
    if (this.levelSystem) {
      await this.levelSystem.save();
    }

    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchToCharacter(characterType);

    // 새 캐릭터의 레벨 데이터 로드
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
    if (this.isPortalTransitioning) return;

    this.isPortalTransitioning = true;

    // 레벨 데이터 저장
    if (this.levelSystem) {
      await this.levelSystem.save();
    }

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

    if (this.jobConditionTracker) {
      this.jobConditionTracker.destroy();
      this.jobConditionTracker = null;
    }

    if (this.currentBoss) {
      this.currentBoss.destroy();
      this.currentBoss = null;
    }

    if (this.bossEventHandler) {
      this.bossEventHandler.destroy();
      this.bossEventHandler = null;
    }

    if (this.levelSystem) {
      this.levelSystem.destroy();
      this.levelSystem = null;
    }

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

    // ✅ await 추가!
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

    // 🎯 B key to spawn boss with better logic
    if (input.isBPressed) {
      if (this.canSpawnBoss()) {
        this.spawnBoss().catch((err) => {
          console.error('Error spawning boss:', err);
        });
      } else {
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

  async autoSave(time) {
    if (!this.lastSaveTime || time - this.lastSaveTime > 5000) {
      this.lastSaveTime = time;
      this.saveCurrentPosition();
      this.saveCurrentCharacterResources();

      // 레벨 시스템 저장
      if (this.levelSystem) {
        await this.levelSystem.save();
      }

      SaveSlotManager.backupCurrentSlot();
    }
  }

  onAttack() {
    this.scene.events.emit('player-attack');
  }

  // 피격 시
  onHit() {
    this.scene.events.emit('player-hit');
  }

  // 데미지 받을 시 (트랩 포함)
  takeDamage(amount) {
    // ... 기존 데미지 처리 ...
    this.scene.events.emit('player-damaged');
  }
}
