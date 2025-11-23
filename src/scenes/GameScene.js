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
import TransitionEffects from '../utils/TransitionEffects.js';

import SkillUnlockSystem from '../models/skill_refactoring/SkillCore/SkillUnlockSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.lastSaveTime = 0;
    this.currentBoss = null;
    this.jobConditionTracker = null;
    this.bossEventHandler = null;
    this.levelSystem = null;
    this.isPlayerDead = false;
    this.spawnSystem = null;
    this.transitionEffects = null;
    this.skillUnlockSystem = null;
  }

  async init(data = {}) {
    console.log('🎮 GameScene init() 호출됨 - 받은 데이터:', JSON.stringify(data, null, 2));

    this.sceneData = data;

    // ✅ 리스폰 플래그 추가
    this.wasRespawned = false;

    //  restart로 들어온 경우 처리
    if (data.respawningCharacter || data.isRespawn) {
      console.log('🔄 리스폰 모드 활성화:', {
        respawningCharacter: data.respawningCharacter,
        isRespawn: data.isRespawn,
        mapKey: data.mapKey,
      });

      this.isPlayerDead = false;
      this.isBossSpawning = false;
      this.currentBoss = null;
      this.respawningCharacter = data.respawningCharacter || data.characterType;
      this.respawnHealth = data.respawnHealth || 100;
      this.wasRespawned = true; // ✅ 리스폰 플래그 설정

      this.savedSpawnData = null;
    } else {
      // ✅ 리스폰이 아닐 때는 null로 초기화
      this.respawningCharacter = null;
      this.respawnHealth = null;
    }

    //  전환 플래그 초기화
    this.isTransitioningToFinalMap = false;

    console.log(
      '✅ init() 완료 - wasRespawned:',
      this.wasRespawned,
      'respawningCharacter:',
      this.respawningCharacter,
    );

    await GameSceneInitializer.initializeScene(this, data);
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
    console.log('🎨 create() 시작 - respawningCharacter:', this.respawningCharacter);

    //  restart로 재생성된 경우 초기화
    if (
      this.sceneData.respawningCharacter ||
      this.sceneData.isRespawn ||
      this.respawningCharacter
    ) {
      console.log('✅ 리스폰 감지됨 - 초기화 진행');
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
    this.transitionEffects = new TransitionEffects(this);

    //  리스폰이 아닐 때만 저장
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

    // ✅ 디버깅 로그 추가
    console.log('🔍 디버깅 정보:', {
      'sceneData.respawningCharacter': this.sceneData.respawningCharacter,
      'sceneData.isRespawn': this.sceneData.isRespawn,
      'this.respawningCharacter': this.respawningCharacter, // ✅ init()에서 설정한 값
      'this.isRespawn': this.isRespawn, // ✅ 이것도 체크
      currentMapKey: this.currentMapKey,
      fromSemiBossVictory: this.sceneData.fromSemiBossVictory,
    });

    console.log(this.wasRespawned && this.currentMapKey === 'final_map');
    // final_map에서 리스폰한 경우 보스 등장 씬 자동 재생
    // init()에서 설정한 this.respawningCharacter 사용!
    if (this.wasRespawned && this.currentMapKey === 'final_map') {
      console.log('🔥 final_map 리스폰 - 보스 등장 씬 재생');
      await this.afterSceneLoad();
    }
    // ✅ Semi Boss 승리 후 전환인 경우에도 보스 등장 씬 재생
    else if (this.sceneData.fromSemiBossVictory) {
      console.log('🔥 Semi Boss 승리 후 - 보스 등장 씬 재생');
      await this.afterSceneLoad();
    }
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

    this.levelSystem.initializeCharacterLevel(this.selectedCharacter);

    // 현재 캐릭터의 레벨 가져오기
    const currentCharLevel = this.levelSystem.getCharacterLevel(this.selectedCharacter);

    // SkillUnlockSystem을 scene, levelSystem, characterType으로 초기화
    this.skillUnlockSystem = new SkillUnlockSystem(this, this.levelSystem, this.selectedCharacter);

    // UIScene에 전달
    if (this.uiScene?.skillCooldown) {
      this.uiScene.skillCooldown.setUnlockSystem(this.skillUnlockSystem);
      console.log(`✅ UIScene에 SkillUnlockSystem 전달 완료`);

      // 즉시 업데이트
      this.uiScene.skillCooldown.updateLockStates();
    } else {
      console.warn('⚠️ UIScene.skillCooldown이 준비되지 않음');
    }

    const expData = await SaveSlotManager.getExpData();
    this._characterExpCache = expData.characterExp || {};

    // 이벤트 리스너
    this.events.on('player-level-up', (newLevel) => {
      this.onPlayerLevelUp(newLevel);
    });

    this.events.on('character-level-up', (data) => {
      this.onCharacterLevelUp(data.characterType, data.level);
    });
  }

  async onCharacterLevelUp(characterType, newLevel) {
    console.log(`🎉 캐릭터 레벨업: ${characterType} Lv.${newLevel}`);

    // 현재 플레이 중인 캐릭터만 UI 효과
    if (characterType === this.selectedCharacter) {
      this.transitionEffects.playLevelUpEffect(newLevel);

      // ✅ 스킬 해금 상태 즉시 업데이트
      if (this.skillUnlockSystem) {
        this.skillUnlockSystem.updateLevel(newLevel);
        console.log(`✅ SkillUnlockSystem 레벨 업데이트 완료: ${newLevel}`);
      }

      // UI 즉시 갱신
      if (this.uiScene?.skillCooldown) {
        this.uiScene.skillCooldown.updateLockStates();

        // 스킬 쿨다운도 함께 업데이트
        if (this.player?.skillSystem) {
          this.uiScene.skillCooldown.updateFromSkills(this.player, this.player.skillSystem.skills);
        }
      }
    }

    await this.levelSystem.save();
    await PortalConditionManager.revalidateAllPortals();
  }

  async onExpGained(amount, characterType) {
    if (this.isPlayerDead || (this.player && this.player.health <= 0)) return;
    if (!this.levelSystem) return;

    try {
      const roundedAmount = Math.round(amount);

      // 전체 레벨 경험치 추가
      const globalLeveledUp = this.levelSystem.addExperienceSync(roundedAmount);

      // 캐릭터별 경험치 추가
      const charLeveledUp = this.levelSystem.addCharacterExperience(characterType, roundedAmount);

      if (!this._characterExpCache) this._characterExpCache = {};
      this._characterExpCache[characterType] =
        (this._characterExpCache[characterType] || 0) + roundedAmount;

      const finalCharacterExp = this._characterExpCache[characterType];
      const levelInfo = this.levelSystem.serialize();

      // 캐릭터 레벨 정보 포함
      const charLevelInfo = this.levelSystem.getCharacterExpInfo(characterType);

      this.events.emit('exp-gained', {
        amount: roundedAmount,
        characterType,
        levelInfo: {
          level: levelInfo.level,
          experience: levelInfo.experience,
          experienceToNext: levelInfo.experienceToNext,
          totalExperience: levelInfo.totalExperience,
        },
        characterLevelInfo: {
          level: charLevelInfo.level,
          experience: charLevelInfo.experience,
          experienceToNext: charLevelInfo.experienceToNext,
        },
        characterExp: finalCharacterExp,
      });

      this.saveExpDataBackground(characterType, finalCharacterExp, levelInfo);

      if (globalLeveledUp || charLeveledUp) {
        // 레벨업 처리는 이벤트 핸들러에서
      }
    } catch (error) {
      console.error('경험치 처리 중 오류:', error);
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
        console.error('백그라운드 저장 실패:', error);
      }
    });
  }

  async onPlayerLevelUp(newLevel) {
    if (this.isPlayerDead || (this.player && this.player.health <= 0)) return;

    if (this.player) {
      this.applyLevelUpBonus();
    }

    this.transitionEffects.playLevelUpEffect(newLevel);

    await this.levelSystem.save();

    // 레벨업 시 포탈 조건 재검사
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

  async loadSaveData() {
    //  리스폰 모드면 저장 데이터 체크 스킵
    if (this.sceneData.respawningCharacter || this.sceneData.isRespawn) {
      this.savedSpawnData = null;
      this.selectedCharacter = this.respawningCharacter || this.sceneData.characterType || 'soul';
      return true;
    }

    //  추가: Semi Boss 승리 후 전환이면 저장 데이터 무시!
    if (this.sceneData.fromSemiBossVictory) {
      this.savedSpawnData = null;
      // currentMapKey는 이미 init()에서 'final_map'으로 설정됨
      return true;
    }

    //  skipSaveCheck가 true면 저장된 맵으로 리다이렉트하지 않음
    if (this.sceneData.skipSaveCheck || this.data.get('skipSaveCheck')) {
      this.savedSpawnData = await SaveSlotManager.getSavedPosition();
      if (this.savedSpawnData) {
        this.selectedCharacter = this.savedSpawnData.characterType || 'soul';
      }
      return true;
    }

    const savedPosition = await SaveSlotManager.getSavedPosition();

    //  저장된 맵이 현재 맵과 다르면 리다이렉트
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

  //  스폰 시스템 사용
  async setupPlayer() {
    this.spawnSystem = new PlayerSpawnSystem(this);

    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);
    this.characterSwitchManager.setCurrentMap(this.currentMapKey);

    const isRespawn = !!(this.respawningCharacter || this.sceneData.isRespawn);

    this.player = this.spawnSystem.createPlayer(this.selectedCharacter, {
      isRespawn: isRespawn,
      respawnHealth: this.respawnHealth || 100,
    });

    if (isRespawn) {
      // ✅ 리스폰 시 모든 상태 완전 초기화
      this.player.isDying = false;
      this.isPlayerDead = false;
      this.player.health = this.respawnHealth || this.player.maxHealth;
      this.player.mana = this.player.maxMana;

      if (this.player.stateMachine) {
        this.player.stateMachine.unlock();
        this.player.stateMachine.changeState('idle');
      }

      this.respawningCharacter = null;
      this.sceneData.isRespawn = false;
    } else {
      // 일반 로드
      if (this.player?.loadSavedResources) {
        await this.player.loadSavedResources();
      }

      if (this.player.health < 10) {
        this.player.health = Math.floor(this.player.maxHealth * 0.1);
      }

      // ✅ 일반 로드 시에도 상태 머신 언락 확인
      if (this.player.stateMachine) {
        this.player.stateMachine.unlock();
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
      console.error('Player not found when creating enemies!');
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

  async canSpawnBoss() {
    const bossConfig = this.mapConfig.boss;
    if (!bossConfig?.enabled) {
      console.warn('⚠️ 이 맵에는 보스가 없음');
      return false;
    }

    if (this.isBossSpawning) {
      console.warn('⚠️ 이미 보스 소환 중');
      return false;
    }

    // 기존 보스 체크
    if (this.currentBoss) {
      if (this.currentBoss.sprite && this.currentBoss.sprite.active && !this.currentBoss.isDead) {
        console.warn('⚠️ 이미 활성화된 보스가 있음');
        return false;
      }
      this.currentBoss = null;
    }

    const bossTypes = Object.values(bossConfig.jobBossMapping || {});
    const bossType = bossTypes[0];

    if (bossType) {
      const savedData = await SaveSlotManager.load();
      const clearedBosses = savedData?.clearedBosses || [];
      const defeatedBosses = Array.from(PortalConditionManager.defeatedBosses);

      console.log('📋 현재 clearedBosses (saveData):', clearedBosses);
      console.log('📋 현재 defeatedBosses (메모리):', defeatedBosses);

      // ✅ semi_boss도 포함하여 체크
      const allDefeatedBosses = [
        ...clearedBosses,
        ...defeatedBosses,
        ...(savedData?.defeatedSemiBosses || []), // semi_boss 기록 추가
      ];

      if (allDefeatedBosses.includes(bossType)) {
        console.log(`⚠️ ${bossType}는 이미 처치했습니다. 소환 불가!`);
        return false;
      }
    }

    if (bossConfig.spawnCondition === 'manual') {
      return true;
    }

    return true;
  }

  async spawnBoss(targetJob = null) {
    const bossConfig = this.mapConfig.boss;

    if (!bossConfig?.enabled) {
      console.warn('⚠️ 이 맵에는 보스가 없음');
      return null;
    }

    if (this.isBossSpawning) {
      console.warn('⚠️ 이미 보스 소환 중');
      return null;
    }

    if (this.currentBoss) {
      this.currentBoss.destroy();
      this.currentBoss = null;
    }

    this.isBossSpawning = true;

    try {
      let bossType;

      if (bossConfig.spawnCondition === 'manual') {
        const bossTypes = Object.values(bossConfig.jobBossMapping);
        if (bossTypes.length === 0) {
          console.error('jobBossMapping에 보스가 없음');
          return null;
        }
        bossType = bossTypes[0];

        // ✅ 재확인: 두 곳 모두 체크 + semi_boss 체크
        const saveData = await SaveSlotManager.load();
        const clearedBosses = saveData?.clearedBosses || [];
        const defeatedBosses = Array.from(PortalConditionManager.defeatedBosses);

        if (clearedBosses.includes(bossType) || defeatedBosses.includes(bossType)) {
          console.log(`⚠️ ${bossType}는 이미 처치했습니다. 소환 불가!`);
          return null;
        }

        // ✅ semi_boss 체크 추가
        if (bossType === 'semi_boss' && clearedBosses.includes('semi_boss')) {
          console.log(`⚠️ semi_boss는 이미 처치했습니다. 소환 불가!`);
          return null;
        }
      } else if (bossConfig.spawnCondition === 'jobChange') {
        if (!targetJob) {
          targetJob = await JobUnlockManager.getNextJobBoss();

          if (!targetJob) {
            console.warn('⚠️ 모든 보스를 이미 도전했습니다!');
            return null;
          }
        }

        const canChallenge = await JobUnlockManager.canJobChange(targetJob);

        if (!canChallenge) {
          console.warn(
            `⚠️ "${targetJob}" 보스는 도전할 수 없습니다. 이미 획득했거나 사용 불가능합니다.`,
          );
          return null;
        }

        bossType =
          bossConfig.jobBossMapping[targetJob] || JobUnlockManager.getBossTypeFromJob(targetJob);
      }

      if (!bossType) {
        console.error('보스 타입을 결정할 수 없음');
        return null;
      }

      console.log(`소환: ${bossType}`);

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
      this.transitionEffects.playBossEntrance(bossType);

      if (this.enemyManager) {
        this.enemyManager.pauseSpawning();
      }

      return this.currentBoss;
    } catch (error) {
      console.error('보스 소환 중 오류:', error);
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

    console.log(`[setupBossDeathHandler] ${bossType} 핸들러 설정`);

    // 원본 destroy 메서드 저장
    if (!boss._originalDestroy) {
      boss._originalDestroy = boss.destroy.bind(boss);
    }

    // destroy 메서드 오버라이드
    boss.destroy = async () => {
      console.log(`[boss.destroy 호출] ${bossType}`);

      const wasTrulyDefeated = boss.hp <= 0 || boss.isDead;

      // 적 목록에서 제거
      if (this.enemyManager?.enemies) {
        const index = this.enemyManager.enemies.indexOf(boss);
        if (index > -1) {
          this.enemyManager.enemies.splice(index, 1);
        }
      }

      // ✅ 보스 처치 기록 저장 (모든 보스에 대해)
      if (wasTrulyDefeated) {
        console.log(`[boss.destroy] recordBossDefeat 호출: ${bossType}`);
        await this.recordBossDefeat(bossType);
        console.log(`[boss.destroy] recordBossDefeat 완료`);
      }

      // ✅ semi_boss는 EnemyBase.destroy()에서 자체적으로 처리하므로
      // GameScene에서는 기록만 저장하고 나머지는 위임
      if (bossType === 'semi_boss') {
        console.log(`[boss.destroy] semi_boss - EnemyBase에 위임`);
        // 원본 destroy 호출 (EnemyBase의 처리 포함)
        boss._originalDestroy();
        this.currentBoss = null;
        return;
      }

      // ✅ 일반 보스/최종 보스 처리
      if (wasTrulyDefeated) {
        console.log(`[boss.destroy] bossDefeated 이벤트 발생`);
        this.events.emit('bossDefeated', bossType);
      }

      console.log(`[boss.destroy] 원본 destroy 호출`);
      boss._originalDestroy();

      if (this.currentBoss === boss) {
        this.currentBoss = null;
      }

      if (wasTrulyDefeated) {
        console.log(`[boss.destroy] onBossDefeated 호출`);
        await this.onBossDefeated(bossType);
      }

      console.log(`[boss.destroy] 완료: ${bossType}`);
    };
  }

  async recordBossDefeat(bossType) {
    try {
      console.log(`[recordBossDefeat 시작] ${bossType}`);

      const saveData = await SaveSlotManager.load();
      if (!saveData) {
        console.error('[recordBossDefeat] saveData 로드 실패');
        return;
      }

      // PortalConditionManager에 추가
      PortalConditionManager.defeatedBosses.add(bossType);
      console.log(`[recordBossDefeat] PortalConditionManager에 추가: ${bossType}`);

      // saveData에 추가
      if (!saveData.clearedBosses) {
        saveData.clearedBosses = [];
      }

      if (!saveData.clearedBosses.includes(bossType)) {
        saveData.clearedBosses.push(bossType);
        console.log(`[recordBossDefeat] clearedBosses에 추가: ${bossType}`);
      }

      console.log(`[recordBossDefeat] 최종 clearedBosses:`, saveData.clearedBosses);

      // 저장
      await SaveSlotManager.save(saveData);
      console.log(`[recordBossDefeat] SaveSlotManager.save 완료`);

      // killData 동기화
      await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);
      console.log(`[recordBossDefeat] saveKillData 완료`);

      // 검증
      const verification = await SaveSlotManager.load();
      console.log(`[recordBossDefeat] 검증 - clearedBosses:`, verification.clearedBosses);
    } catch (error) {
      console.error('[recordBossDefeat] 오류:', error);
    }
  }

  //  Semi_boss → Phase 2 변환 (수정된 버전)
  async transformSemiBossToPhase2() {
    if (!this.currentBoss) {
      console.error('currentBoss is null!');
      return;
    }

    const camera = this.cameras.main;
    const boss = this.currentBoss;

    // ✅ TransitionEffects 사용
    this.transitionEffects.playGlitchEffect();
    await this.delay(800);

    // 페이드 아웃
    camera.fadeOut(400, 0, 0, 0);
    await this.delay(400);

    // 보스 상태 초기화
    boss.isDead = false;
    boss.isBeingHit = false;

    // HP를 최대값의 50%로 리셋
    boss.hp = Math.ceil(boss.maxHP * 0.5);

    // HPbar 업데이트
    if (boss.hpBar) {
      boss.hpBar.visible = true;
      const hpPercent = boss.hp / boss.maxHP;
      boss.hpBar.width = boss.hpBarMaxWidth * hpPercent;
      boss.hpBar.setFillStyle(0xffff00); // 노란색
    }

    // 보스 스프라이트 상태 초기화
    if (boss.sprite && boss.sprite.body) {
      boss.sprite.body.setVelocity(0, 0);
      boss.sprite.setAlpha(1);
    }

    // 보스 컨트롤러 상태 초기화
    if (boss.controller) {
      boss.controller.currentPhase = 2;
      boss.controller.phaseTransitionTriggered = false;
      boss.controller.applyPhaseChanges(2);
    }

    // 플레이어 상태 잠금 해제
    if (this.player?.stateMachine) {
      this.player.stateMachine.unlock();
    }

    // 페이드 인
    camera.fadeIn(400, 0, 0, 0);
    await this.delay(400);

    this.transitionEffects.playPhase2Entrance();
  }

  async transitionToFinalMapAfterSemiBoss() {
    if (this.isTransitioningToFinalMap) {
      console.warn('⚠️ 이미 final_map으로 전환 중');
      return;
    }
    this.isTransitioningToFinalMap = true;

    const camera = this.cameras.main;

    if (this.player?.stateMachine) {
      this.player.stateMachine.lock();
    }

    try {
      console.log('⏳ semi_boss → final_map 전환 시작');

      await this.delay(500);

      this.transitionEffects.playVHSGlitch(2000);
      await this.delay(2000);

      camera.fadeOut(1500, 0, 0, 0);
      await this.delay(1500);

      // ✅ 저장 작업 - recordBossDefeat이 완료된 후 실행
      console.log('💾 데이터 저장 중...');
      if (this.levelSystem) await this.levelSystem.save();
      await this.saveCurrentCharacterResources();

      // ✅ killData 다시 한번 저장 (안전성)
      await SaveSlotManager.saveKillData(KillTracker, PortalConditionManager);
      console.log('💾 모든 데이터 저장 완료');

      this.cleanupBeforeTransition();

      this.scene.start('GameScene', {
        mapKey: 'final_map',
        characterType: this.selectedCharacter,
        skipSaveCheck: true,
        fromSemiBossVictory: true,
        fromBossVictory: true,
      });
    } catch (error) {
      console.error('❌ final_map 전환 중 오류:', error);
      this.isTransitioningToFinalMap = false;
    }
  }

  async afterSceneLoad() {
    console.log('🎬 afterSceneLoad 호출됨 - currentMapKey:', this.currentMapKey);

    // ✅ final_map에서 보스 등장 연출
    if (this.currentMapKey === 'final_map') {
      console.log('✅ final_map 확인됨 - 보스 등장 연출 시작');

      // ✅ final_boss를 이미 처치했는지 확인
      const saveData = await SaveSlotManager.load();
      const clearedBosses = saveData?.clearedBosses || [];

      if (clearedBosses.includes('final_boss')) {
        console.log('⚠️ final_boss는 이미 처치했습니다. 소환 스킵!');
        return;
      }

      await this.delay(1000);
      console.log('⏰ 1초 대기 완료');

      await this.transitionEffects.showFinalBossAwakeningMessage();
      console.log('💬 각성 메시지 표시 완료');

      await this.delay(3000);
      console.log('⏰ 3초 대기 완료 - 보스 소환 시작');

      this.spawnBoss().catch((err) => console.error('Error spawning final boss:', err));
    } else {
      console.log('⚠️ final_map이 아님 - 보스 등장 연출 스킵');
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

  async transitionToFinalMap() {
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
  }

  async playSemiBossDefeatCinematic() {
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

  //  스폰 시스템 사용
  async switchToSelectedCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    if (this.levelSystem) await this.levelSystem.save();
    await this.saveCurrentCharacterResources();

    const currentX = this.player?.sprite?.x || 0;
    this.player?.destroy();

    this.player = this.spawnSystem.createPlayerForSwitch(characterType, currentX);

    if (this.player?.loadSavedResources) {
      await this.player.loadSavedResources();
    }

    this.selectedCharacter = characterType;
    this.characterSwitchManager.setCurrentCharacterType(characterType);

    this.setupCamera();

    // ✅ LevelSystem 재초기화
    this.levelSystem = new LevelSystem(this);
    await this.levelSystem.load();

    // 새 캐릭터 레벨 초기화
    this.levelSystem.initializeCharacterLevel(characterType);

    // ✅ 현재 캐릭터의 레벨 가져오기
    const currentCharLevel = this.levelSystem.getCharacterLevel(characterType);

    // ✅ SkillUnlockSystem 재설정 (레벨 정보 포함)
    if (this.skillUnlockSystem) {
      this.skillUnlockSystem.levelSystem = this.levelSystem;
      this.skillUnlockSystem.setCurrentCharacter(characterType, currentCharLevel);
    } else {
      this.skillUnlockSystem = new SkillUnlockSystem(this, this.levelSystem, characterType);
    }

    // UIScene에 전달 및 즉시 업데이트
    if (this.uiScene?.skillCooldown) {
      this.uiScene.skillCooldown.setUnlockSystem(this.skillUnlockSystem);
      this.uiScene.skillCooldown.updateLockStates();
      console.log(`✅ 캐릭터 전환 후 UI 업데이트 완료`);
    }

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
    // ✅ 간단하게 정리 - isSceneShuttingDown 플래그 제거

    if (this.currentBoss) {
      console.log('⚠️ 보스 전투 중 씬 전환 - 보스 기록 저장 안 함');
      if (this.currentBoss._originalDestroy) {
        this.currentBoss._originalDestroy();
      } else if (this.currentBoss.destroy) {
        this.currentBoss.destroy();
      }
      this.currentBoss = null;
    }

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

    this.bossEventHandler?.destroy();
    this.bossEventHandler = null;

    this.levelSystem?.destroy();
    this.levelSystem = null;

    this.skillUnlockSystem?.destroy();
    this.skillUnlockSystem = null;

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

  async onPlayerDeath() {
    if (this.isPlayerDead) return;

    this.isPlayerDead = true;

    if (this.currentBoss) {
      console.log('💀 플레이어 사망 - 보스 전투 실패, 기록 저장 안 함');
      if (this.currentBoss._originalDestroy) {
        this.currentBoss._originalDestroy();
      }
      this.currentBoss = null;
    }

    const currentMap = this.currentMapKey;
    const currentCharacter = this.selectedCharacter;
    const respawnHealth = 100;

    console.log('💀 플레이어 사망 - 리스폰 데이터:', {
      currentMap,
      currentCharacter,
      respawnHealth,
    });

    // 게임 오버 연출
    await this.transitionEffects.playDeathEffect();

    this.scene.start('GameScene', {
      mapKey: currentMap,
      characterType: currentCharacter,
      skipSaveCheck: true,
      respawningCharacter: currentCharacter,
      isRespawn: true,
      respawnHealth: respawnHealth,
    });
  }

  async update(time, delta) {
    if (!this.isPlayerReady()) return;

    if (this.player && this.player.health <= 0 && !this.isPlayerDead && !this.player.isDying) {
      await this.onPlayerDeath();
      return;
    }

    if (this.isPlayerDead || (this.player && this.player.isDying)) {
      return;
    }

    if (this.jobConditionTracker) {
      this.jobConditionTracker.update(time);
    }

    if (this.skillUnlockSystem?.update) {
      this.skillUnlockSystem.update(time, delta);
    }

    this.handleInput(time, delta);
    await this.updateGameObjects(time, delta);
    this.emitPlayerEvents();
    this.effectManager.update();
    await this.autoSave(time);
  }

  async handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    this.handleCharacterSelectInput(input, time);

    if (input.isBPressed) {
      const canSpawn = await this.canSpawnBoss();
      if (canSpawn) {
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
    this.player.update();
    this.mapModel.update(this.player.sprite);
    this.enemyManager?.update(time, delta);

    if (this.currentBoss && !this.currentBoss.isDead) {
      this.currentBoss.update(time, delta);

      // ✅ 보스 체력 체크 - 죽으면 destroy 호출
      if (this.currentBoss.hp <= 0) {
        console.log(`[GameScene] 보스 죽음 감지: ${this.currentBoss.enemyType}`);

        // isDead 플래그 설정
        this.currentBoss.isDead = true;

        // destroy 메서드 호출
        if (this.currentBoss.destroy) {
          console.log(`[GameScene] boss.destroy() 호출`);
          this.currentBoss.destroy();
        }
        return;
      }
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

    //  ESC 키만 명시적으로 처리
    if (input.isEscHeld) {
      this.openPauseMenu();
      return;
    }

    //  캐릭터 선택 입력
    this.handleCharacterSelectInput(input, time);

    //  보스 소환 (B 키)
    if (input.isBPressed) {
      if (this.canSpawnBoss()) {
        this.spawnBoss().catch((err) => console.error('Error spawning boss:', err));
      }
    }

    //  데이터 초기화 (L 키)
    if (input.isLPressed) {
      this.clearAllSaveData();
    }

    //  테스트 씬 (Down 화살표)
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
    this.isPlayerDead = isDeath;
  }

  async onPlayerDeath() {
    // ✅ Prevent double-death scenarios
    if (this.isPlayerDead || this.isSceneShuttingDown) return;

    this.isPlayerDead = true;
    this.isSceneShuttingDown = true; // ✅ Prevent other operations

    if (this.currentBoss) {
      console.log('💀 플레이어 사망 - 보스 전투 실패, 기록 저장 안 함');
      if (this.currentBoss._originalDestroy) {
        this.currentBoss._originalDestroy();
      }
      this.currentBoss = null;
    }

    const currentMap = this.currentMapKey;
    const currentCharacter = this.selectedCharacter;
    const respawnHealth = 100;

    console.log('💀 플레이어 사망 - 리스폰 데이터:', {
      currentMap,
      currentCharacter,
      respawnHealth,
    });

    // Give current frame time to finish
    await this.delay(100);

    await this.transitionEffects.playDeathEffect();

    this.scene.start('GameScene', {
      mapKey: currentMap,
      characterType: currentCharacter,
      skipSaveCheck: true,
      respawningCharacter: currentCharacter,
      isRespawn: true,
      respawnHealth: respawnHealth,
    });
  }

  async onBossDefeated(bossType) {
    console.log(`[onBossDefeated] ${bossType} 처치 완료`);

    if (this.player?.stateMachine) {
      this.player.stateMachine.lock();
    }

    if (this.player?.sprite?.body) {
      this.player.sprite.body.setVelocity(0, 0);
      this.player.sprite.body.setAcceleration(0, 0);
      this.player.sprite.body.setGravityY(0);
      this.player.sprite.body.moves = false;
    }

    if (this.player?.stateMachine) {
      this.player.stateMachine.changeState('idle');
    }

    // 경험치 보상
    const expReward = 500 + Math.random() * 200;
    await this.onExpGained(expReward, this.selectedCharacter);

    if (this.player) {
      this.player.health = this.player.maxHealth;
      this.player.mana = this.player.maxMana;
    }

    await this.saveCurrentPosition();

    if (this.player?.sprite) {
      this.player.sprite.body.immovable = true;
      this.player.sprite.body.pushable = false;
    }

    if (this.enemyManager) {
      this.enemyManager.resumeSpawning();
    }

    console.log(`[onBossDefeated] ${bossType} 처리 완료`);
  }
}
