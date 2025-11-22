import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
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
    console.log('🎮 GameScene.init() called with data:', data);
    console.log('mapKey received:', data.mapKey);
    console.log('fromSemiBossVictory:', data.fromSemiBossVictory);

    this.sceneData = data;

    // ✅ restart로 들어온 경우 처리
    if (data.respawningCharacter || data.isRespawn) {
      console.log('🔄 Scene restarted for respawn');

      this.isPlayerDead = false;
      this.isBossSpawning = false;
      this.currentBoss = null;
      this.respawningCharacter = data.respawningCharacter || data.characterType;
      this.respawnHealth = data.respawnHealth || 100;

      this.savedSpawnData = null;
    }

    // ✅ 전환 플래그 초기화
    this.isTransitioningToFinalMap = false;

    await GameSceneInitializer.initializeScene(this, data);

    console.log('✅ After initializeScene, currentMapKey:', this.currentMapKey);
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
    // ✅ restart로 재생성된 경우 초기화
    if (this.sceneData.respawningCharacter || this.sceneData.isRespawn) {
      console.log('🔄 Creating scene after restart');
      this.isPlayerDead = false;
      this.isBossSpawning = false;
      this.currentBoss = null;
    }

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

    await this.setupPlayer();

    this.setupLevelSystem();

    this.bossEventHandler = new BossEventHandler(this);
    this.bossEventHandler.setupBossEvents();

    if (this.sceneData.showJobUnlock) {
      this.time.delayedCall(500, () => {
        this.bossEventHandler.showJobUnlockOnSceneStart(this.sceneData.showJobUnlock);
      });
    }

    this.setupCamera();
    this.setupEnemies();
    this.setupCharacterSelectUI();
    this.emitInitialEvents();
    this.setupJobConditionTracker();

    // ✅ 리스폰이 아닐 때만 저장
    if (!this.sceneData.respawningCharacter && !this.sceneData.isRespawn && !this.savedSpawnData) {
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

    // ✅ 리스폰 완료 로그
    if (this.sceneData.respawningCharacter || this.sceneData.isRespawn) {
      console.log('✅ Respawn complete - Boss state reset');
      console.log('Current states:', {
        isPlayerDead: this.isPlayerDead,
        isBossSpawning: this.isBossSpawning,
        currentBoss: this.currentBoss,
      });
    }
    await this.afterSceneLoad();
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
    console.log('📂 loadSaveData called');
    console.log('currentMapKey:', this.currentMapKey);
    console.log('sceneData:', this.sceneData);

    // ✅ 리스폰 모드면 저장 데이터 체크 스킵
    if (this.sceneData.respawningCharacter || this.sceneData.isRespawn) {
      console.log('⏭️ Skipping save data check (respawn mode)');
      this.savedSpawnData = null;
      this.selectedCharacter = this.respawningCharacter || this.sceneData.characterType || 'soul';
      return true;
    }

    // ✅ 추가: Semi Boss 승리 후 전환이면 저장 데이터 무시!
    if (this.sceneData.fromSemiBossVictory) {
      console.log('⏭️ Skipping save data check (from Semi Boss victory)');
      this.savedSpawnData = null;
      // currentMapKey는 이미 init()에서 'final_map'으로 설정됨
      return true;
    }

    // ✅ skipSaveCheck가 true면 저장된 맵으로 리다이렉트하지 않음
    if (this.sceneData.skipSaveCheck || this.data.get('skipSaveCheck')) {
      console.log('⏭️ skipSaveCheck is true - not redirecting');
      this.savedSpawnData = await SaveSlotManager.getSavedPosition();
      if (this.savedSpawnData) {
        this.selectedCharacter = this.savedSpawnData.characterType || 'soul';
      }
      return true;
    }

    const savedPosition = await SaveSlotManager.getSavedPosition();
    console.log('savedPosition:', savedPosition);

    // ✅ 저장된 맵이 현재 맵과 다르면 리다이렉트
    if (savedPosition && savedPosition.mapKey !== this.currentMapKey) {
      console.log('🔄 Redirecting to saved map:', savedPosition.mapKey);
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

    // ✅ 리스폰 체크 (respawningCharacter 또는 isRespawn)
    const isRespawn = !!(this.respawningCharacter || this.sceneData.isRespawn);

    console.log('🎮 Creating player:', {
      characterType: this.selectedCharacter,
      isRespawn,
      respawnHealth: this.respawnHealth,
    });

    this.player = this.spawnSystem.createPlayer(this.selectedCharacter, {
      isRespawn: isRespawn,
      respawnHealth: this.respawnHealth || 100,
    });

    if (isRespawn) {
      // ✅ 리스폰 시 모든 상태 완전 초기화
      console.log('💀➡️❤️ Resetting player state after respawn');

      this.player.isDying = false;
      this.isPlayerDead = false;
      this.player.health = this.respawnHealth || this.player.maxHealth;
      this.player.mana = this.player.maxMana;

      if (this.player.stateMachine) {
        this.player.stateMachine.unlock();
        this.player.stateMachine.changeState('idle');
      }

      // ✅ 리스폰 플래그 제거
      this.respawningCharacter = null;
      this.sceneData.isRespawn = false;

      console.log('✅ Player respawn complete');
    } else {
      // 일반 로드
      if (this.player?.loadSavedResources) {
        await this.player.loadSavedResources();
      }

      if (this.player.health < 10) {
        this.player.health = Math.floor(this.player.maxHealth * 0.1);
      }
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

  canSpawnBoss() {
    const bossConfig = this.mapConfig.boss;
    if (!bossConfig?.enabled) {
      console.log('❌ Boss not enabled for this map');
      return false;
    }

    if (this.isBossSpawning) {
      console.log('❌ Boss is already spawning');
      return false;
    }

    // ✅ 기존 보스 체크 강화
    if (this.currentBoss) {
      if (this.currentBoss.sprite && this.currentBoss.sprite.active && !this.currentBoss.isDead) {
        console.log('❌ Boss already exists and is alive');
        return false;
      }
      // 죽었거나 비활성화된 보스는 제거
      console.log('🗑️ Cleaning up old boss reference');
      this.currentBoss = null;
    }

    if (bossConfig.spawnCondition === 'manual') {
      console.log('✅ Can spawn boss (manual mode)');
      return true;
    }

    return true;
  }

  async spawnBoss(targetJob = null) {
    const bossConfig = this.mapConfig.boss;

    console.log('🎯 spawnBoss called:', {
      enabled: bossConfig?.enabled,
      isBossSpawning: this.isBossSpawning,
      currentBoss: !!this.currentBoss,
      spawnCondition: bossConfig?.spawnCondition,
    });

    if (!bossConfig?.enabled) {
      console.log('❌ Boss not enabled for this map');
      return null;
    }

    if (this.isBossSpawning) {
      console.log('❌ Already spawning boss');
      return null;
    }

    // ✅ 기존 보스 완전 제거
    if (this.currentBoss) {
      console.log('🗑️ Removing existing boss');
      this.currentBoss.destroy();
      this.currentBoss = null;
    }

    this.isBossSpawning = true;
    console.log('🎯 Starting boss spawn...');

    try {
      let bossType;

      if (bossConfig.spawnCondition === 'manual') {
        const bossTypes = Object.values(bossConfig.jobBossMapping);
        if (bossTypes.length === 0) {
          console.error('❌ No boss type defined in jobBossMapping');
          return null;
        }
        bossType = bossTypes[0];
        console.log('✅ Manual boss type:', bossType);
      } else if (bossConfig.spawnCondition === 'jobChange') {
        if (!targetJob) {
          targetJob = await JobUnlockManager.getNextJobBoss();
        }

        const canChallenge = await JobUnlockManager.canJobChange(targetJob);
        if (!canChallenge) return null;

        bossType =
          bossConfig.jobBossMapping[targetJob] || JobUnlockManager.getBossTypeFromJob(targetJob);
      }

      if (!bossType) {
        console.error('❌ Could not determine boss type');
        return null;
      }

      const spawnPos = this.calculateBossSpawnPosition();
      const colliderTop = this.physics.world.bounds.height - 200;

      console.log('🎯 Spawning boss:', bossType, 'at', spawnPos);
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

      console.log('✅ Boss spawned successfully');
      return this.currentBoss;
    } catch (error) {
      console.error('❌ Boss spawn error:', error);
      this.currentBoss = null;
      return null;
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
    const bossType = boss.enemyType;

    if (!boss._originalDestroy) {
      boss._originalDestroy = boss.destroy.bind(boss);
    }

    boss.destroy = async () => {
      console.log('🎯 Boss destroy called:', bossType);

      // 적 목록에서 제거
      if (this.enemyManager?.enemies) {
        const index = this.enemyManager.enemies.indexOf(boss);
        if (index > -1) this.enemyManager.enemies.splice(index, 1);
      }

      // ✅ semi_boss는 bossDefeated 이벤트 발생 안 함! (클리어 문구 방지)
      if (bossType === 'semi_boss') {
        console.log('🔄 Semi_boss defeated - skipping clear message, going to final_map');

        // 보스 처치 기록만
        await PortalConditionManager.recordBossDefeat(bossType);

        // 스프라이트 정리
        boss._originalDestroy();
        this.currentBoss = null;

        // final_map으로 이동
        await this.transitionToFinalMapAfterSemiBoss();
        return;
      }

      // ✅ 일반 보스만 이벤트 발생 (클리어 문구 표시)
      this.events.emit('bossDefeated', bossType);
      await PortalConditionManager.recordBossDefeat(bossType);

      boss._originalDestroy();
      if (this.currentBoss === boss) {
        this.currentBoss = null;
      }
    };
  }

  // ✅ Semi_boss → Phase 2 변환 (수정된 버전)
  async transformSemiBossToPhase2() {
    console.log('🔄 Semi_boss transforming to Phase 2...');

    if (!this.currentBoss) {
      console.error('❌ currentBoss is null!');
      return;
    }

    const camera = this.cameras.main;
    const boss = this.currentBoss;

    console.log('Boss state before transformation:', {
      isDead: boss.isDead,
      hp: boss.hp,
      maxHP: boss.maxHP,
      sprite: !!boss.sprite,
    });

    // 1️⃣ 화면 글리치 효과 (지지직 거리기)
    console.log('1️⃣ Playing glitch effect...');
    this.playGlitchEffect();
    await this.delay(800);

    // 2️⃣ 페이드 아웃
    console.log('2️⃣ Fading out...');
    camera.fadeOut(400, 0, 0, 0);
    await this.delay(400);

    // 3️⃣ 보스 상태 초기화
    console.log('3️⃣ Resetting boss state...');
    boss.isDead = false;
    boss.isBeingHit = false;

    // HP를 최대값의 50%로 리셋
    boss.hp = Math.ceil(boss.maxHP * 0.5);
    console.log(`   HP reset to: ${boss.hp} / ${boss.maxHP}`);

    // HPbar 업데이트
    if (boss.hpBar) {
      boss.hpBar.visible = true;
      const hpPercent = boss.hp / boss.maxHP;
      boss.hpBar.width = boss.hpBarMaxWidth * hpPercent;
      boss.hpBar.setFillStyle(0xffff00); // 노란색
    }

    // 4️⃣ 보스 스프라이트 상태 초기화
    if (boss.sprite && boss.sprite.body) {
      boss.sprite.body.setVelocity(0, 0);
      boss.sprite.setAlpha(1);
    }

    // 5️⃣ 보스 컨트롤러 상태 초기화
    if (boss.controller) {
      console.log('5️⃣ Updating controller...');
      boss.controller.currentPhase = 2;
      boss.controller.phaseTransitionTriggered = false;
      boss.controller.applyPhaseChanges(2);
    }

    // 6️⃣ 플레이어 상태 잠금 해제
    if (this.player?.stateMachine) {
      this.player.stateMachine.unlock();
    }

    // 7️⃣ 페이드 인
    console.log('7️⃣ Fading in...');
    camera.fadeIn(400, 0, 0, 0);
    await this.delay(400);

    // 8️⃣ Phase 2 진입 연출
    console.log('8️⃣ Playing Phase 2 entrance...');
    this.playPhase2Entrance();

    console.log('✅ Phase 2 activated! Boss is ready for battle');
  }

  async transitionToFinalMapAfterSemiBoss() {
    console.log('🚪 transitionToFinalMapAfterSemiBoss - START');

    // ✅ 이미 전환 중이면 중복 방지
    if (this.isTransitioningToFinalMap) {
      console.log('⚠️ Already transitioning to final map');
      return;
    }
    this.isTransitioningToFinalMap = true;
    console.log('✅ Set isTransitioningToFinalMap = true');

    const camera = this.cameras.main;

    // 플레이어 입력 잠금
    if (this.player?.stateMachine) {
      this.player.stateMachine.lock();
      console.log('🔒 Player locked');
    }

    try {
      // 1️⃣ 짧은 대기
      console.log('⏳ Waiting 500ms...');
      await this.delay(500);
      console.log('✅ Wait complete');

      // 2️⃣ 페이드 아웃 (검은색)
      console.log('🎬 Starting fadeOut...');
      camera.fadeOut(1500, 0, 0, 0);
      await this.delay(1500);
      console.log('✅ FadeOut complete');

      // 3️⃣ 현재 상태 저장
      console.log('💾 Saving state...');
      if (this.levelSystem) await this.levelSystem.save();
      await this.saveCurrentCharacterResources();
      await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);
      console.log('✅ State saved');

      // 4️⃣ 씬 정리
      console.log('🧹 Cleaning up...');
      this.cleanupBeforeTransition();
      console.log('✅ Cleanup complete');

      // 5️⃣ final_map으로 이동
      console.log('🚀 Starting final_map scene!');
      console.log('Parameters:', {
        mapKey: 'final_map',
        characterType: this.selectedCharacter,
        skipSaveCheck: true,
        fromSemiBossVictory: true,
      });

      this.scene.start('GameScene', {
        mapKey: 'final_map',
        characterType: this.selectedCharacter,
        skipSaveCheck: true,
        fromSemiBossVictory: true,
      });

      console.log('✅ scene.start called!');
    } catch (error) {
      console.error('❌ Error in transitionToFinalMapAfterSemiBoss:', error);
      this.isTransitioningToFinalMap = false;
    }
  }

  async afterSceneLoad() {
    // ✅ Semi_boss 처치 후 첫 입장 시
    if (this.sceneData.fromSemiBossVictory) {
      console.log('🎬 First entry to Final Map after Semi Boss victory');

      // 약간의 대기
      await this.delay(1000);

      // 메시지 표시
      this.showFinalBossAwakeningMessage();

      // 자동으로 보스 소환
      await this.delay(3000);
      this.spawnBoss().catch((err) => console.error('Error spawning final boss:', err));
    }
  }

  showFinalBossAwakeningMessage() {
    const camera = this.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;

    // 배경 어둡게
    const darkOverlay = this.add
      .rectangle(centerX, centerY, camera.width * 2, camera.height * 2, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(9999)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: darkOverlay,
      alpha: 0.7,
      duration: 800,
    });

    // 메시지 텍스트
    const messageText = this.add
      .text(centerX, centerY - 100, '봉인되었던 힘이 깨어난다...', {
        fontSize: '40px',
        fontFamily: 'Arial',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: messageText,
      alpha: 1,
      duration: 600,
      ease: 'Power2.easeIn',
    });

    // 추가 텍스트
    const subText = this.add
      .text(centerX, centerY + 50, '최종 보스가 각성했다!', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: subText,
      alpha: 1,
      duration: 600,
      delay: 400,
      ease: 'Power2.easeIn',
    });

    // 3초 후 페이드 아웃
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [darkOverlay, messageText, subText],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          darkOverlay.destroy();
          messageText.destroy();
          subText.destroy();
        },
      });
    });
  }

  playGlitchEffect() {
    const camera = this.cameras.main;
    const glitchDuration = 800;
    const glitchIntensity = 12;

    const startTime = this.time.now;

    const glitchInterval = this.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.time.now - startTime > glitchDuration) {
          return;
        }

        // 랜덤 오프셋으로 글리치 효과
        const offsetX = Phaser.Math.Between(-glitchIntensity, glitchIntensity);
        const offsetY = Phaser.Math.Between(-glitchIntensity, glitchIntensity);

        camera.setScroll(camera.scrollX + offsetX, camera.scrollY + offsetY);
      },
      repeat: Math.floor(glitchDuration / 50),
    });

    // 화면 밝기 깜빡임 (전기 효과)
    this.cameras.main.flash(200, 100, 150, 255);
    this.time.delayedCall(300, () => this.cameras.main.flash(200, 100, 150, 255));
    this.time.delayedCall(600, () => this.cameras.main.flash(200, 100, 150, 255));
  }

  playPhase2Entrance() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // "PHASE 2" 텍스트
    const phase2Text = this.add
      .text(centerX, centerY - 100, 'PHASE 2', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.5);

    // 등장 애니메이션
    this.tweens.add({
      targets: phase2Text,
      alpha: 1,
      scale: 1.3,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // 추가 텍스트
    const descText = this.add
      .text(centerX, centerY + 50, '보스가 완전한 힘을 드러낸다!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#FFAA00',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: descText,
      alpha: 1,
      duration: 400,
      delay: 200,
    });

    // 파티클 효과 (보스 주변)
    if (this.currentBoss?.sprite) {
      const particles = this.add.particles(
        this.currentBoss.sprite.x,
        this.currentBoss.sprite.y,
        'particle',
        {
          speed: { min: 150, max: 300 },
          scale: { start: 1.5, end: 0 },
          lifespan: 1200,
          quantity: 50,
          blendMode: 'ADD',
          tint: [0xff0000, 0xff6600, 0xffaa00],
        },
      );

      this.time.delayedCall(1200, () => particles.destroy());

      // 보스 깜빡임 효과
      this.tweens.add({
        targets: this.currentBoss.sprite,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 6,
      });
    }

    // 텍스트 페이드 아웃
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [phase2Text, descText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          phase2Text.destroy();
          descText.destroy();
        },
      });
    });
  }

  async transitionToFinalMap() {
    console.log('🚪 Transitioning to Final Map');

    // 현재 상태 저장
    if (this.levelSystem) await this.levelSystem.save();
    await this.saveCurrentCharacterResources();
    await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);

    // 씬 정리
    this.cleanupBeforeTransition();

    // final_map으로 이동
    this.scene.start('GameScene', {
      mapKey: 'final_map',
      characterType: this.selectedCharacter,
      skipSaveCheck: true,
      fromBossVictory: true, // 보스 승리 후 전환 플래그
    });
  }

  delay(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // ========================================
  // 보스 페이즈 전환 연출 (2페이즈용)
  // ========================================

  async playBossPhaseTransition(boss, currentPhase, nextPhase) {
    console.log(`🔄 Boss Phase Transition: ${currentPhase} → ${nextPhase}`);

    // 플레이어 입력 잠금
    if (this.player?.stateMachine) {
      this.player.stateMachine.lock();
    }

    // 보스 무적 처리
    boss.isInvincible = true;

    const camera = this.cameras.main;
    const bossX = boss.sprite.x;
    const bossY = boss.sprite.y;

    // 1️⃣ 보스 중심으로 카메라 이동
    this.tweens.add({
      targets: camera,
      scrollX: bossX - camera.width / 2,
      scrollY: bossY - camera.height / 2,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    await this.delay(500);

    // 2️⃣ 화면 진동 (2번)
    camera.shake(300, 0.015);
    await this.delay(400);
    camera.shake(300, 0.015);
    await this.delay(400);

    // 3️⃣ 파워업 파티클
    const powerUpParticles = this.add.particles(bossX, bossY, 'particle', {
      speed: { min: 100, max: 200 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1500,
      frequency: 50,
      blendMode: 'ADD',
      tint: [0xff0000, 0xff00ff, 0x8800ff],
    });

    // 4️⃣ 보스 깜빡임 효과
    this.tweens.add({
      targets: boss.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 8,
    });

    // 5️⃣ 경고 텍스트
    const warningText = this.add
      .text(camera.centerX, camera.centerY - 150, `⚠️ PHASE ${nextPhase} ⚠️`, {
        fontSize: '56px',
        fontFamily: 'Arial Black',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: warningText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 2,
    });

    await this.delay(1500);

    // 6️⃣ 플래시 효과
    camera.flash(500, 255, 100, 100);

    powerUpParticles.destroy();
    warningText.destroy();

    await this.delay(500);

    // 보스 무적 해제
    boss.isInvincible = false;

    // 플레이어 입력 해제
    if (this.player?.stateMachine) {
      this.player.stateMachine.unlock();
    }

    // 카메라 다시 플레이어 추적
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);

    console.log('✅ Phase Transition Complete');
  }

  async playSemiBossDefeatCinematic() {
    console.log('🎬 Semi Boss Defeat Cinematic Start');

    // 플레이어 입력 잠금
    if (this.player?.stateMachine) {
      this.player.stateMachine.lock();
    }

    // 카메라 줌 효과 (보스에게 집중)
    const camera = this.cameras.main;
    const bossX = this.currentBoss?.sprite?.x || camera.centerX;
    const bossY = this.currentBoss?.sprite?.y || camera.centerY;

    // 1️⃣ 보스 폭발 효과 (파티클)
    if (this.currentBoss?.sprite) {
      const explosionParticles = this.add.particles(bossX, bossY, 'particle', {
        speed: { min: 200, max: 400 },
        scale: { start: 2, end: 0 },
        lifespan: 1000,
        quantity: 50,
        blendMode: 'ADD',
        tint: [0xff0000, 0xff6600, 0xffaa00],
      });

      this.time.delayedCall(1000, () => explosionParticles.destroy());
    }

    // 2️⃣ 화면 격렬한 진동 (3번)
    await this.shakeScreenSequence(camera, 3);

    // 3️⃣ 플래시 효과 (밝아짐)
    camera.flash(1000, 255, 255, 255);
    await this.delay(1000);

    // 4️⃣ 승리 텍스트
    await this.showVictoryText();

    // 5️⃣ 페이드 아웃
    camera.fadeOut(1500, 0, 0, 0);
    await this.delay(1500);

    console.log('🎬 Cinematic Complete');
  }

  async shakeScreenSequence(camera, count = 3) {
    for (let i = 0; i < count; i++) {
      const intensity = 0.02 + i * 0.01; // 점점 강해짐
      camera.shake(400, intensity);
      await this.delay(500);
    }
  }

  async showVictoryText() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // "VICTORY" 텍스트
    const victoryText = this.add
      .text(centerX, centerY - 100, 'VICTORY', {
        fontSize: '72px',
        fontFamily: 'Arial Black',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.5);

    // 등장 애니메이션
    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
    });

    await this.delay(1000);

    // "Moving to Final Stage..." 텍스트
    const nextStageText = this.add
      .text(centerX, centerY + 50, 'Moving to Final Stage...', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: nextStageText,
      alpha: 1,
      duration: 500,
    });

    await this.delay(1500);

    // 페이드 아웃
    this.tweens.add({
      targets: [victoryText, nextStageText],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        victoryText.destroy();
        nextStageText.destroy();
      },
    });

    await this.delay(500);
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
    console.log('🧹 cleanupBeforeTransition - START');

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

    // ✅ 수정: currentBoss.destroy() 호출하지 않음!
    // 이미 EnemyBase에서 정리했거나, 무한 루프 방지
    // this.currentBoss?.destroy();  // ❌ 이 줄 제거 또는 주석처리!
    this.currentBoss = null;

    this.bossEventHandler?.destroy();
    this.bossEventHandler = null;

    this.levelSystem?.destroy();
    this.levelSystem = null;

    this.isBossSpawning = false;

    console.log('🧹 cleanupBeforeTransition - DONE');
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

    // if (this.player?.stateMachine?.isLocked) {
    //   this.player.update();
    //   return;
    // }

    // 사망 체크
    if (this.player && this.player.health <= 0 && !this.isPlayerDead && !this.player.isDying) {
      this.player.onDeath();
      return;
    }

    if (this.isPlayerDead || (this.player && this.player.isDying)) {
      return;
    }

    if (this.jobConditionTracker) {
      this.jobConditionTracker.update(time);
    }

    // ✅ 입력 처리 (오타 수정)
    this.handleInput(time, delta);

    await this.updateGameObjects(time, delta);
    this.emitPlayerEvents();
    this.effectManager.update();
    await this.autoSave(time);
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    this.handleCharacterSelectInput(input, time);

    // B키로 보스 소환 (dark, final_map에서 작동)
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

  isPlayerReady() {
    return this.player?.sprite?.active && this.inputHandler;
  }

  async updateGameObjects(time, delta) {
    // player.update()가 여기서 호출됨 (이동/상태 업데이트)
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

  andleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    // ✅ ESC 키만 명시적으로 처리
    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    // ✅ 캐릭터 선택 입력
    this.handleCharacterSelectInput(input, time);

    // ✅ 보스 소환 (B 키)
    if (input.isBPressed) {
      if (this.canSpawnBoss()) {
        this.spawnBoss().catch((err) => console.error('Error spawning boss:', err));
      }
    }

    // ✅ 데이터 초기화 (L 키)
    if (input.isLPressed) {
      this.clearAllSaveData();
    }

    // ✅ 테스트 씬 (Down 화살표)
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
