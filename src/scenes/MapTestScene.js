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
import BackgroundLayerManager from '../systems/GameScene/BackgroundLayerManager.js';
import CombatCollisionHandler from '../systems/GameScene/CombatCollisionHandler.js';

const TEST_MAP_KEY = 'final_map'; // 원하는 맵 키로 변경 가능

export default class MapTestScene extends Phaser.Scene {
  constructor() {
    super('MapTestScene');
  }

  init(data = {}) {
    // 맵 키는 data에서 받거나 기본값 사용
    this.currentMapKey = data.mapKey || TEST_MAP_KEY;
    this.selectedCharacter = data.characterType || 'soul';

    // 맵 설정 로드
    this.mapConfig = MAPS[this.currentMapKey];
    if (!this.mapConfig) {
      console.error(`Map config not found: ${this.currentMapKey}`);
    }
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
    EffectLoader.preloadAllEffects(this);
  }

  loadPortalAssets() {
    for (let i = 1; i <= 16; i++) {
      this.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  create() {
    this.preventTabDefault();
    this.setupInputHandler();
    EffectLoader.createAllAnimations(this);

    this.setupScene();
    this.createBackground();
    this.setupPlayer();
    this.setupCamera();
    this.setupEnemies();
    this.setupCharacterSelectUI();

    // 맵 정보 표시
    this.showMapInfo();
  }

  preventTabDefault() {
    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
    });
  }

  setupScene() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.physics.world.gravity.y = this.mapConfig.gravity;
  }

  createBackground() {
    const { spawn, portals } = this.mapModel.create();
    this.spawnPosition = spawn;
    this.portals = portals;

    const bgManager = new BackgroundLayerManager(this);
    this.backgroundLayers = bgManager.createLayers();
  }

  setupPlayer() {
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);
    this.characterSwitchManager.setCurrentMap(this.currentMapKey);

    this.createPlayer(this.selectedCharacter, this.spawnPosition.x, this.spawnPosition.y);
  }

  createPlayer(characterType, x, y) {
    this.player = CharacterFactory.create(this, characterType, x, y, {
      scale: this.mapConfig.playerScale || 1,
    });

    this.player.sprite.setDepth(this.mapConfig.depths.player);
    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    this.setupSwitchCooldown();
  }

  setupSwitchCooldown() {
    this.isCharacterSwitchOnCooldown = true;
    this.time.delayedCall(1800, () => {
      this.isCharacterSwitchOnCooldown = false;
    });
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

  setupInputHandler() {
    this.inputHandler = new InputHandler(this);
  }

  showMapInfo() {
    // 화면에 맵 정보 표시
    const text = this.add.text(10, 10, `Map: ${this.currentMapKey}\nPress M to change map`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    text.setScrollFactor(0);
    text.setDepth(1000);
  }

  switchCharacter(direction = 'next') {
    if (this.isCharacterSwitchOnCooldown) return;

    const characters = ['soul', 'skull', 'demon'];
    const currentIndex = characters.indexOf(this.selectedCharacter);

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % characters.length;
    } else {
      newIndex = (currentIndex - 1 + characters.length) % characters.length;
    }

    const newCharacter = characters[newIndex];
    this.switchToCharacter(newCharacter);
  }

  switchToCharacter(characterType) {
    if (this.isCharacterSwitchOnCooldown) return;
    if (characterType === this.selectedCharacter) return;

    this.isCharacterSwitchOnCooldown = true;

    const oldPlayer = this.player;
    const x = oldPlayer.sprite.x;
    const y = oldPlayer.sprite.y;
    const velocityX = oldPlayer.sprite.body.velocity.x;
    const velocityY = oldPlayer.sprite.body.velocity.y;

    if (this.playerCollider?.destroy) {
      this.playerCollider.destroy();
    }
    oldPlayer.destroy();

    this.selectedCharacter = characterType;
    this.createPlayer(characterType, x, y);

    this.player.sprite.setVelocity(velocityX, velocityY);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.time.delayedCall(1800, () => {
      this.isCharacterSwitchOnCooldown = false;
    });
  }

  switchToSelectedCharacter(characterType) {
    this.switchToCharacter(characterType);
  }

  changeMap(mapKey) {
    // 맵 변경
    this.scene.restart({
      mapKey: mapKey,
      characterType: this.selectedCharacter,
    });
  }

  update(time, delta) {
    if (!this.isPlayerReady()) return;

    this.updateGameObjects(time, delta);
    this.handleInput(time, delta);
  }

  isPlayerReady() {
    return this.player?.sprite?.active && this.inputHandler;
  }

  updateGameObjects(time, delta) {
    this.player.update();
    this.mapModel.update(this.player.sprite);
    this.enemyManager?.update(time, delta);

    const handler = new CombatCollisionHandler(this);
    handler.checkAttackCollisions();

    this.effectManager.update();
  }

  handleInput(time, delta) {
    const input = this.inputHandler.getInputState();

    // M키로 맵 변경 메뉴 (간단한 예시)
    if (input.isMPressed) {
      this.showMapSelectMenu();
    }

    // 캐릭터 선택 UI
    this.handleCharacterSelectInput(input, time);

    // Tab으로 캐릭터 변경
    if (input.isTabPressed && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('prev');
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

  showMapSelectMenu() {
    // 사용 가능한 모든 맵 키 가져오기
    const mapKeys = Object.keys(MAPS);
    // 현재 맵의 다음 맵으로 변경 (순환)
    const currentIndex = mapKeys.indexOf(this.currentMapKey);
    const nextIndex = (currentIndex + 1) % mapKeys.length;
    const nextMapKey = mapKeys[nextIndex];

    this.changeMap(nextMapKey);
  }
}
