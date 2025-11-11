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

// 새로운 매니저들
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
  }

  loadPortalAssets() {
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  async create() {
    await this.initializeUI();

    // loadSaveData가 false를 반환하면 씬 전환 중이므로 create 중단
    const shouldContinue = await this.loadSaveData();
    if (!shouldContinue) {
      return; // 씬 전환 중이므로 create를 멈춤
    }

    this.setupScene();
    this.createBackground();
    this.setupPlayer();
    this.setupCamera();
    this.setupEnemies();
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
      return true; // 여기서 바로 리턴해야 함
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

  setupPlayer() {
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);

    this.createPlayer(this.selectedCharacter, this.spawnPosition.x, this.spawnPosition.y);
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

  emitInitialEvents() {
    this.events.emit('character-changed', {
      characterType: this.selectedCharacter,
      player: this.player,
    });
  }

  createPlayer(characterType, x, y, restoreState = false) {
    const finalY = this.calculatePlayerSpawnY(y);

    this.player = CharacterFactory.create(this, characterType, x, finalY, {
      scale: this.mapConfig.playerScale || 1,
    });

    this.player.sprite.setDepth(this.mapConfig.depths.player);
    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    this.setupSwitchCooldown();

    if (restoreState) {
      this.restorePlayerState(characterType);
    }
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
    const handler = new CharacterSwitchHandler(this);
    await handler.switchCharacter(direction);
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

    // 포탈 위치 저장
    await SaveManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

    this.cleanupBeforeTransition();
    this.scene.start('GameScene', {
      mapKey: targetMapKey,
      characterType: this.selectedCharacter,
      skipSaveCheck: true,
    });
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
    this.inputHandler = new InputHandler(this); // 플레이어 움직임용

    this.sceneKeys = {
      // Scene 레벨 단축키 (캐릭터 전환, 저장 등)
      backQuote: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACK_QUOTE),
      tab: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
      lKey: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
    };
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    // Scene 레벨 키 체크 (Phaser.Input.Keyboard.JustDown 사용)
    if (
      Phaser.Input.Keyboard.JustDown(this.sceneKeys.backQuote) &&
      !this.isCharacterSwitchOnCooldown
    ) {
      this.switchCharacter('next');
    }

    if (Phaser.Input.Keyboard.JustDown(this.sceneKeys.tab) && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('prev');
    }

    if (Phaser.Input.Keyboard.JustDown(this.sceneKeys.lKey)) {
      this.clearAllSaveData();
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
    }
  }
}
