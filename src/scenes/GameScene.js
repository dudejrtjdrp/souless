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
    // 🎯 포탈 전환 플래그 초기화
    this.isPortalTransitioning = false;

    // 기본값 먼저 설정
    this.currentMapKey = data.mapKey || 'forest';
    this.selectedCharacter = data.characterType || 'assassin';

    // Scene 데이터 저장 (skipSaveCheck 플래그)
    this.data.set('skipSaveCheck', data.skipSaveCheck || false);

    console.log('🎮 GameScene init:', {
      mapKey: this.currentMapKey,
      character: this.selectedCharacter,
      skipSaveCheck: data.skipSaveCheck,
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

  async create() {
    // 🎯 세이브 파일 체크 (init에서 넘어온 데이터가 없을 때만)
    if (!this.data || !this.data.get('skipSaveCheck')) {
      const savedPosition = await SaveManager.getSavedPosition();

      if (savedPosition && savedPosition.mapKey !== this.currentMapKey) {
        // 저장된 맵과 현재 맵이 다르면 Scene 재시작 (한 번만!)
        console.log(`📂 Restarting with saved map: ${savedPosition.mapKey}`);

        this.scene.start('GameScene', {
          mapKey: savedPosition.mapKey,
          characterType: savedPosition.characterType || 'assassin',
          skipSaveCheck: true, // 재시작 시 세이브 체크 건너뛰기
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
      // skipSaveCheck가 true면 세이브 파일 다시 로드
      const savedPosition = await SaveManager.getSavedPosition();
      if (savedPosition) {
        this.savedSpawnData = savedPosition;
        this.selectedCharacter = savedPosition.characterType || 'assassin';
        console.log('📂 Loaded from save (second pass):', savedPosition);
      }
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.physics.world.gravity.y = this.mapConfig.gravity;

    const { spawn, portals } = this.mapModel.create();

    // 🎯 Spawn 위치 결정
    const spawnPosition = this.determineSpawnPosition(spawn, portals);
    console.log('📍 Spawn position:', spawnPosition);

    // 🎯 레이어 생성 (자동 스케일 적용)
    if (this.mapConfig.layers && this.mapConfig.layers.length > 0) {
      const autoScale = this.mapModel.config.autoScale;
      const mapScale = this.mapConfig.mapScale || 1;

      this.mapConfig.layers.forEach((layer, index) => {
        const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);

        // 자동 스케일이 있으면 사용, 없으면 mapScale 사용
        if (autoScale) {
          img.setScale(autoScale);
          console.log(`📐 Layer ${layer.key} scaled to ${autoScale.toFixed(2)}`);
        } else {
          img.setScale(mapScale);
        }

        img.setDepth(this.mapConfig.depths.backgroundStart + index);
      });
    }

    // 카메라 오프셋 설정 (자동 또는 수동)
    const cameraOffsetY =
      this.mapConfig.camera?.offsetY || this.mapModel.AUTO_CONFIG.DEFAULT_CAMERA_OFFSET_Y;

    // 캐릭터 전환 매니저 초기화
    this.characterSwitchManager = new CharacterSwitchManager(this);
    this.characterSwitchManager.setCurrentCharacterType(this.selectedCharacter);

    // 플레이어 생성
    this.spawnPosition = spawnPosition;
    console.log(this.savedSpawnData);
    console.log(spawnPosition.y);
    this.createPlayer(this.selectedCharacter, spawnPosition.x, spawnPosition.y);

    // 카메라 설정
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);
    camera.followOffset.set(0, this.mapConfig.camera.offsetY);

    // 적 매니저 생성
    this.enemyManager = new EnemyManager(this, this.mapConfig, this.mapModel, this.player);
    this.enemyManager.createInitial();

    this.inputHandler = new InputHandler(this);

    // 캐릭터 전환 키 입력 설정
    this.setupCharacterSwitchInput();

    // UI 텍스트 추가
    this.createSwitchUI();

    // 🎯 초기 위치 저장 (세이브 파일이 없었다면)
    if (!this.savedSpawnData) {
      this.saveCurrentPosition();
    }
  }

  /**
   * 🎯 Spawn 위치 결정 로직
   */
  determineSpawnPosition(defaultSpawn, portals) {
    let rawPosition = null;

    // 1️⃣ 세이브 파일이 없으면 → 첫 번째 포탈 위치
    if (!this.savedSpawnData) {
      const firstPortalConfig = PortalManager.getPortalsByMap(this.currentMapKey)[0];

      if (firstPortalConfig) {
        console.log('🌀 Spawning at first portal:', firstPortalConfig);
        rawPosition = {
          x: firstPortalConfig.sourcePosition.x,
          y: firstPortalConfig.sourcePosition.y,
        };
      } else {
        console.log('📍 Spawning at default spawn (no portals)');
        rawPosition = defaultSpawn;
      }
    }
    // 2️⃣ 포탈을 통해 왔으면 → 해당 포탈 위치
    else if (this.savedSpawnData.fromPortal && this.savedSpawnData.portalId) {
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
    }
    // 3️⃣ 맵 내에서 캐릭터 전환했으면 → 저장된 위치
    else if (this.savedSpawnData.x !== undefined && this.savedSpawnData.y !== undefined) {
      console.log('📍 Spawning at saved position:', this.savedSpawnData);
      rawPosition = { x: this.savedSpawnData.x, y: this.savedSpawnData.y };
    }
    // 4️⃣ 그 외의 경우 기본 spawn
    else {
      console.log('📍 Spawning at default spawn');
      rawPosition = defaultSpawn;
    }

    // ✅ autoScale 모드일 때는 Y 좌표를 안전한 위치로 조정
    if (this.mapModel.config.autoScale && rawPosition) {
      const groundY = this.mapModel.getGroundY();
      // 포탈 Y 좌표가 ground 근처이면 위로 올림
      if (rawPosition.y >= groundY - 100) {
        const adjustedY = groundY - 150; // 땅 위 150px
        console.log(`✅ Adjusted spawn Y: ${rawPosition.y} → ${adjustedY} (ground: ${groundY})`);
        rawPosition.y = adjustedY;
      }
    }

    return rawPosition;
  }

  /**
   * 현재 위치 저장 (맵 내에서 이동 중)
   */
  async saveCurrentPosition() {
    if (!this.player || !this.player.sprite) return;

    await SaveManager.savePosition(
      this.currentMapKey,
      this.player.sprite.x,
      this.player.sprite.y,
      this.selectedCharacter,
    );
  }

  /**
   * 포탈 이동 시 호출할 메서드
   * @param {string} targetMapKey - 다음 맵 키
   * @param {string} portalId - 다음 맵에서 도착할 포탈 ID
   */
  async onPortalEnter(targetMapKey, portalId) {
    // 🎯 이미 전환 중이면 무시
    console.log(targetMapKey);
    if (this.isPortalTransitioning) {
      console.log('⏳ Portal transition already in progress...');
      console.log(this.inputHandler);
      return;
    }

    this.isPortalTransitioning = true;

    console.log(`🌀 Entering portal to ${targetMapKey}, portal: ${portalId}`);

    // if (this.inputHandler)
    // 포탈 위치 저장
    await SaveManager.savePortalPosition(targetMapKey, portalId, this.selectedCharacter);

    // 현재 플레이어 정리
    if (this.player) {
      if (this.playerCollider && this.playerCollider.destroy) {
        this.playerCollider.destroy();
        this.playerCollider = null;
      }
      this.player.destroy();
      this.player = null;
    }

    // 적 매니저 정리
    if (this.enemyManager) {
      this.enemyManager.destroy();
      this.enemyManager = null;
    }

    // 맵 전환 (skipSaveCheck: true로 중복 방지)
    console.log(targetMapKey);
    this.scene.start('GameScene', {
      mapKey: targetMapKey,
      characterType: this.selectedCharacter,
      skipSaveCheck: true, // 중요!
    });
  }

  /**
   * 플레이어 캐릭터 생성
   */
  createPlayer(characterType, x, y, restoreState = false) {
    // ✅ savedSpawnData가 있고 physics 정보가 있을 때만 오프셋 적용
    let finalY = y;

    if (this.savedSpawnData && this.savedSpawnData['physics']) {
      const offsetY = this.savedSpawnData['physics'].offsetY || 100;
      // autoScale이 아닐 때만 오프셋 적용
      if (!this.mapModel.config.autoScale) {
        finalY = y - offsetY - 35;
      }
    }

    console.log('🎮 Creating player:', {
      originalY: y,
      finalY: finalY,
      autoScale: this.mapModel.config.autoScale,
      hasSavedData: !!this.savedSpawnData,
    });

    this.player = CharacterFactory.create(this, characterType, x, finalY, {
      scale: this.mapConfig.playerScale || 1,
    });
    this.player.sprite.setDepth(this.mapConfig.depths.player);

    // 플레이어 collider 생성 및 저장
    this.playerCollider = this.mapModel.addPlayer(this.player.sprite);

    // ✅ 캐릭터 전환 쿨다운
    this.isCharacterSwitchOnCooldown = true;
    this.time.delayedCall(1800, () => {
      this.isCharacterSwitchOnCooldown = false;
    });

    // 저장된 상태 복원
    if (restoreState) {
      const savedState = this.characterSwitchManager.loadCharacterState(characterType);
      this.characterSwitchManager.applyStateToCharacter(this.player, savedState, false);
    }
  }

  /**
   * 캐릭터 전환 키 입력 설정
   */
  setupCharacterSwitchInput() {
    // const input = InputHandler.getInputState();
    // // ` (백틱) 키로 다음 캐릭터
    // if (input.isBackQuotePressed) {
    //   this.switchCharacter('next');
    // }
    // // Tab 키로 이전 캐릭터
    // if (input.isTabPressed) {
    //   this.switchCharacter('prev');
    // }
    // // L 키로 저장 데이터 삭제
    // if (input.isLPressed) {
    //   console.log('🗑 Clearing all saved data in localStorage!');
    //   localStorage.clear();
    //   SaveManager.clear();
    //   if (this.switchText) {
    //     this.switchText.setText('🗑 All save data cleared! Reload the page.');
    //   }
    // }
  }

  /**
   * 캐릭터 전환 실행
   */
  async switchCharacter(direction = 'next') {
    if (this.characterSwitchManager.isTransitioning) {
      console.log('⏳ Already transitioning...');
      return;
    }

    // 🎯 현재 위치 저장 (캐릭터 전환 전)
    await this.saveCurrentPosition();

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

    // 전환 이펙트
    this.cameras.main.flash(200, 255, 255, 255);

    // 기존 플레이어 제거
    if (this.player) {
      if (this.playerCollider && this.playerCollider.destroy) {
        this.playerCollider.destroy();
        this.playerCollider = null;
      }
      this.player.destroy();
      this.player = null;
    }

    // 새 캐릭터 생성
    this.time.delayedCall(100, async () => {
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

      // 🎯 전환 후 위치 저장
      await this.saveCurrentPosition();

      this.characterSwitchManager.debugPrintStates();
    });
  }

  /**
   * 전환 UI 생성
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
        `Press \` to switch | Map: ${this.currentMapKey}`,
      ]);
    }
  }

  update(time, delta) {
    // 플레이어가 없거나 파괴된 경우 업데이트 중단
    if (!this.player || !this.player.sprite || !this.player.sprite.active) {
      return;
    }

    this.player.update();
    this.mapModel.update(this.player.sprite);

    if (this.enemyManager) {
      this.enemyManager.update(time, delta);
    }

    this.checkAttackCollisions();

    // UI 업데이트
    if (this.switchText && time % 100 < delta) {
      this.updateSwitchUI();
    }

    const input = this.inputHandler.getInputState();

    // ` (백틱) 키로 다음 캐릭터
    if (input.isBackQuotePressed && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('next');
    }

    // Tab 키로 이전 캐릭터
    if (input.isTabPressed && !this.isCharacterSwitchOnCooldown) {
      this.switchCharacter('prev');
    }

    if (input.isLPressed) {
      console.log('🗑 Clearing all saved data in localStorage!');
      localStorage.clear();
      SaveManager.clear();
      if (this.switchText) {
        this.switchText.setText('🗑 All save data cleared! Reload the page.');
      }
    }

    if (input.isLPressed) {
      console.log('🗑 Clearing all saved data in localStorage!');
      localStorage.clear();
      SaveManager.clear();
      if (this.switchText) {
        this.switchText.setText('🗑 All save data cleared! Reload the page.');
      }
    }

    // 🎯 주기적으로 위치 저장 (선택사항 - 5초마다)
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
