import Phaser from 'phaser';
import MapModel from '../models/map/MapModel.js';
import EnemyManager from '../controllers/EnemyManager.js';
import { MAPS } from '../config/mapData.js';
import EnemyAssetLoader from '../utils/EnemyAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import CharacterSwitchManager from '../systems/CharacterSwitchManager.js';
import SaveManager from '../utils/SaveManager.js';
import InputHandler from '../characters/systems/InputHandler.js';
import CharacterSelectOverlay from '../systems/GameScene/CharacterSelectOverlay.js';
import { EffectLoader } from '../systems/Effects/EffectLoader.js';
import { EffectManager } from '../systems/Effects/EffectManager.js';

import GameSceneInitializer from '../systems/GameScene/GameSceneInitializer.js';
import PlayerSpawnManager from '../systems/GameScene/PlayerSpawnManager.js';
import BackgroundLayerManager from '../systems/GameScene/BackgroundLayerManager.js';
import CharacterSwitchHandler from '../systems/GameScene/CharacterSwitchHandler.js';
import CombatCollisionHandler from '../systems/GameScene/CombatCollisionHandler.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  async init(data = {}) {
    await GameSceneInitializer.initializeScene(this, data);
  }

  preload() {
    if (!this.mapConfig) return;

    this.loadMapAssets();
    this.loadCharacterAssets();
    this.loadPortalAssets();
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

    // EffectLoader를 통해 모든 이펙트 로드
    EffectLoader.preloadAllEffects(this);

    // 사용할 캐릭터의 이펙트만 로드
    // const effectKeys = EffectLoader.extractAllEffectKeys(CharacterData);
    // console.log('Loading effects:', Array.from(effectKeys));
    // EffectLoader.preloadEffects(this, Array.from(effectKeys));
  }

  loadPortalAssets() {
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  async create() {
    await this.initializeUI();
    EffectLoader.createAllAnimations(this);

    const shouldContinue = await this.loadSaveData();
    if (!shouldContinue) {
      return;
    }

    this.setupScene();
    this.createBackground();

    await this.setupPlayer(); //  async/await 추가

    this.setupCamera();
    this.setupEnemies();
    this.setupCharacterSelectUI();
    this.emitInitialEvents();

    if (!this.savedSpawnData) {
      this.saveCurrentPosition();
    }

    if (this.uiScene) {
      this.uiScene.handleCharacterChanged({
        characterType: this.selectedCharacter,
        player: this.player,
      });
    }

    this.isPortalTransitioning = false;
  }

  async initializeUI() {
    this.scene.launch('UIScene');
    this.uiScene = this.scene.get('UIScene');
    await GameSceneInitializer.waitForUIReady(this);
  }

  async loadSaveData() {
    this.setupInputHandler();
    this.preventTabDefault();

    // skipSaveCheck가 true면 저장 데이터 체크를 건너뜀
    if (this.data.get('skipSaveCheck')) {
      this.savedSpawnData = await SaveManager.getSavedPosition();
      if (this.savedSpawnData) {
        this.selectedCharacter = this.savedSpawnData.characterType || 'assassin';
      }
      return true;
    }

    const savedPosition = await SaveManager.getSavedPosition();

    // 저장된 위치가 있고, 현재 맵과 다른 경우에만 재시작
    if (savedPosition && savedPosition.mapKey !== this.currentMapKey) {
      this.restartWithSavedMap(savedPosition);
      return false;
    }

    this.savedSpawnData = savedPosition;
    if (savedPosition) {
      this.selectedCharacter = savedPosition.characterType || 'assassin';
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
      characterType: savedPosition.characterType || 'assassin',
      skipSaveCheck: true,
    });
  }

  setupScene() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.physics.world.gravity.y = this.mapConfig.gravity;
  }

  createBackground() {
    const { spawn, portals, underSolidRect } = this.mapModel.create();

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

    //  생성 후 체력/마나 복원
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
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();
  }

  //  캐릭터 선택 UI 초기화
  setupCharacterSelectUI() {
    this.characterSelectOverlay = new CharacterSelectOverlay(this);
    this.isBackQuoteHeld = false;
    this.backQuoteHoldStartTime = 0;
  }

  emitInitialEvents() {
    this.events.emit('character-changed', {
      characterType: this.selectedCharacter,
      player: this.player,
    });
  }

  createPlayer(characterType, x, y, restoreState = true) {
    //  기본값을 true로
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
  }

  //  캐릭터 선택 UI를 통한 직접 전환
  async switchToSelectedCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    await this.saveCurrentCharacterResources();

    const handler = new CharacterSwitchHandler(this);
    await handler.switchToCharacter(characterType);
  }

  async saveCurrentPosition() {
    if (!this.player?.sprite) return;

    await SaveManager.savePosition(
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

    // 포탈 위치 저장
    await SaveManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

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

    const handler = new CombatCollisionHandler(this);
    this.uiScene.update(time, delta);
    handler.checkAttackCollisions();
  }

  setupInputHandler() {
    this.inputHandler = new InputHandler(this);
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    //  ` 키 홀드 체크 (캐릭터 선택 UI)
    this.handleCharacterSelectInput(input, time);

    //  Tab 키로 이전 캐릭터 (빠른 전환)
    if (input.isTabPressed && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('prev');
    }

    //  L 키로 세이브 데이터 삭제
    if (input.isLPressed) {
      this.clearAllSaveData();
    }

    if (input.isDownPressed) {
      // T키로 테스트 씬 열기
      this.scene.start('EffectTestScene');
    }
  }

  //  캐릭터 선택 UI 입력 처리
  handleCharacterSelectInput(input, time) {
    // ` 키를 누르기 시작
    if (input.isBackQuotePressed) {
      this.isBackQuoteHeld = true;
      this.backQuoteHoldStartTime = time;
    }

    // ` 키를 홀드 중
    if (input.isBackQuoteHeld && this.isBackQuoteHeld) {
      const holdDuration = time - this.backQuoteHoldStartTime;

      // 300ms 이상 누르면 UI 표시
      if (holdDuration >= 300 && !this.characterSelectOverlay.isVisible) {
        this.characterSelectOverlay.show();
      }

      // UI가 표시된 상태에서 방향키 입력 처리
      if (this.characterSelectOverlay.isVisible) {
        if (input.isLeftPressed) {
          this.characterSelectOverlay.moveSelection('left');
        }
        if (input.isRightPressed) {
          this.characterSelectOverlay.moveSelection('right');
        }
      }
    }

    // ` 키를 뗌
    if (input.isBackQuoteReleased && this.isBackQuoteHeld) {
      this.isBackQuoteHeld = false;

      // UI가 표시되어 있으면 선택된 캐릭터로 전환
      if (this.characterSelectOverlay.isVisible) {
        const selectedChar = this.characterSelectOverlay.getSelectedCharacter();
        this.characterSelectOverlay.hide();
        this.switchToSelectedCharacter(selectedChar);
      } else {
        // 짧게 눌렀으면 다음 캐릭터로 빠른 전환
        if (!this.isCharacterSwitchOnCooldown) {
          this.switchCharacter('next');
        }
      }
    }
  }

  clearAllSaveData() {
    localStorage.clear();
    SaveManager.clear();

    if (this.switchText) {
      this.switchText.setText('🗑 All save data cleared! Reload the page.');
    }
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
    }
  }
}
