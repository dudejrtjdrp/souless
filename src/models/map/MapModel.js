import Phaser from 'phaser';
import Portal from './Portal.js';

export default class MapModel {
  constructor(scene, mapKey, config, debug = false) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.config = config;
    this.debug = debug;

    this.tiledMap = null;
    this.collisionGround = null;
    this.collisionLayer = null;
    this.entityColliders = [];
    this.portals = [];
    console.log(this.scene.scale.height);
    // 자동 설정용 상수
    this.AUTO_CONFIG = {
      TARGET_HEIGHT: this.scene.scale.height * 1.4, // 고정 높이 (화면 높이)
      COLLISION_HEIGHT: 200, // 하단 충돌 영역 높이
      DEFAULT_CAMERA_OFFSET_Y: 350, // 기본 카메라 Y 오프셋
    };
  }

  preload() {
    this.loadMapJSON();
    this.loadTilesets();

    // 포탈 애니메이션 이미지 로드
    for (let i = 1; i <= 16; i++) {
      this.scene.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  loadMapJSON() {
    // mapPath가 있을 때만 로드
    if (this.config.mapPath) {
      this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
    } else {
      console.log(` No tilemap for ${this.mapKey}, using auto-config mode`);
    }
  }

  loadTilesets() {
    if (this.config.tilesets) {
      this.config.tilesets.forEach(({ key, imagePath }) => {
        this.scene.load.image(key, imagePath);
      });
    }
  }

  create() {
    this.createTilemap();
    this.addTilesets();

    // 자동 레이어 스케일링 (JSON 없을 때)
    if (!this.config.mapPath && this.config.layers) {
      this.autoScaleLayers();
    }

    this.setupWorldBounds();
    this.createFixedCollisionGround();
    const spawn = this.calculateSpawn();

    this.createPortals(); // 포탈 생성

    return {
      spawn,
      collisionGround: this.collisionGround,
      collisionLayer: this.collisionLayer,
      portals: this.portals,
    };
  }

  createTilemap() {
    // mapPath가 있을 때만 생성
    if (this.config.mapPath) {
      this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });
    } else {
      // 타일맵 없이 빈 객체 생성 (자동 설정)
      this.tiledMap = {
        widthInPixels: 0, // autoScaleLayers에서 계산
        heightInPixels: this.AUTO_CONFIG.TARGET_HEIGHT,
      };
    }
  }

  /**
   * 🎯 레이어 자동 스케일링
   * - 첫 번째 레이어의 높이를 TARGET_HEIGHT에 맞춤
   * - 모든 레이어에 동일한 스케일 적용
   * - 너비는 비율에 맞게 자동 계산
   */
  autoScaleLayers() {
    if (!this.config.layers || this.config.layers.length === 0) return;

    const firstLayerKey = this.config.layers[0].key;
    const firstLayerTexture = this.scene.textures.get(firstLayerKey);

    if (!firstLayerTexture || !firstLayerTexture.source[0]) {
      console.error(`❌ Cannot find texture: ${firstLayerKey}`);
      return;
    }

    const originalWidth = firstLayerTexture.source[0].width;
    const originalHeight = firstLayerTexture.source[0].height;

    // 높이를 TARGET_HEIGHT에 맞추는 스케일 계산
    const scale = this.AUTO_CONFIG.TARGET_HEIGHT / originalHeight;
    const scaledWidth = originalWidth * scale;

    console.log('🎨 Auto-scaling layers:', {
      originalSize: `${originalWidth}x${originalHeight}`,
      scale: scale.toFixed(2),
      targetHeight: this.AUTO_CONFIG.TARGET_HEIGHT,
      finalSize: `${scaledWidth.toFixed(0)}x${this.AUTO_CONFIG.TARGET_HEIGHT}`,
    });

    // 계산된 크기 저장
    this.tiledMap.widthInPixels = scaledWidth;
    this.tiledMap.heightInPixels = this.AUTO_CONFIG.TARGET_HEIGHT;

    // 자동 계산된 스케일을 config에 저장
    this.config.autoScale = scale;
    this.config.mapScale = 1; // 이미 레이어에 스케일 적용했으므로 1로 설정
  }

  addTilesets() {
    // tiledMap이 실제 Tilemap 객체일 때만 실행
    if (this.tiledMap && this.tiledMap.addTilesetImage) {
      return this.config.tilesets.map(({ nameInTiled, key }) =>
        this.tiledMap.addTilesetImage(nameInTiled, key),
      );
    }
    return [];
  }

  setupWorldBounds() {
    const { width, height } = this.getScaledMapSize();

    // Physics world bounds 설정
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);

    console.log('🌍 World bounds set:', {
      width,
      height,
      physicsWorld: this.scene.physics.world.bounds,
    });

    // ✅ Physics world가 제대로 설정됐는지 강제 확인
    if (
      this.scene.physics.world.bounds.width !== width ||
      this.scene.physics.world.bounds.height !== height
    ) {
      console.error('❌ Physics world bounds mismatch!');
      this.scene.physics.world.setBounds(0, 0, width, height);
    }
  }

  getScaledMapSize() {
    // 자동 스케일 모드
    if (!this.config.mapPath) {
      return {
        width: this.tiledMap.widthInPixels,
        height: this.tiledMap.heightInPixels,
      };
    }

    // 기존 타일맵 모드
    return {
      width: this.tiledMap.widthInPixels * this.config.mapScale,
      height: this.tiledMap.heightInPixels * this.config.mapScale,
    };
  }

  calculateSpawn() {
    const { width, height } = this.getScaledMapSize();

    // 자동 모드: 충돌 영역 위에 스폰
    if (!this.config.mapPath) {
      const groundTop = height - this.AUTO_CONFIG.COLLISION_HEIGHT;
      const spawnY = groundTop - 50; // ✅ 충돌 영역 위 50px (캐릭터 높이 고려)

      console.log('🎯 Spawn calculated:', {
        mapHeight: height,
        collisionHeight: this.AUTO_CONFIG.COLLISION_HEIGHT,
        groundTop: groundTop,
        spawnY: spawnY,
      });

      return {
        x: 100,
        y: spawnY,
      };
    }

    // 기존 설정 사용
    const { x, y, offsetY } = this.config.spawn;

    let spawnX = x;
    if (x === 'left') {
      spawnX = 50 * this.config.mapScale;
    } else if (x === 'right') {
      spawnX = width - 50 * this.config.mapScale;
    }

    let spawnY = y;
    if (y === 'bottom') {
      spawnY = height - (offsetY || 0);
    }

    return { x: spawnX, y: spawnY };
  }

  createFixedCollisionGround() {
    const { width, height } = this.getScaledMapSize();

    // 자동 모드: 하단 200px
    if (!this.config.mapPath && !this.config.collision) {
      const groundHeight = this.AUTO_CONFIG.COLLISION_HEIGHT;
      const groundY = height - groundHeight / 2;

      this.collisionGround = this.scene.add.rectangle(
        width / 2,
        groundY,
        width,
        groundHeight,
        0x00ff00,
        0.3, // ✅ 디버그용: 일단 반투명으로 보이게
      );

      console.log('✅ Auto-created collision ground:', {
        y: groundY,
        width,
        height: groundHeight,
        centerX: width / 2,
        top: groundY - groundHeight / 2,
        bottom: groundY + groundHeight / 2,
      });
    } else {
      // 기존 설정 사용
      const groundHeight = this.config.collision?.groundHeight || 200;
      const groundY = height - groundHeight / 2;

      this.collisionGround = this.scene.add.rectangle(
        width / 2,
        groundY,
        width,
        groundHeight,
        0x00ff00,
        0,
      );
    }

    this.scene.physics.add.existing(this.collisionGround, true);

    if (this.collisionGround.body) {
      this.collisionGround.body.immovable = true;
      this.collisionGround.body.moves = false;

      // ✅ Physics body 크기 강제 설정
      this.collisionGround.body.setSize(width, this.AUTO_CONFIG.COLLISION_HEIGHT);
      this.collisionGround.body.updateFromGameObject();

      console.log('✅ Collision ground body:', {
        x: this.collisionGround.body.x,
        y: this.collisionGround.body.y,
        width: this.collisionGround.body.width,
        height: this.collisionGround.body.height,
      });
    }

    this.collisionGround.setDepth(this.config.depths?.collision || 10);
  }

  createPortals() {
    if (!this.config.portals) return;

    this.config.portals.forEach((portalData) => {
      const portal = new Portal(this.scene, portalData);
      this.portals.push(portal);
    });

    console.log(`✅ Created ${this.portals.length} portals for map: ${this.mapKey}`);
  }

  getPortalById(portalId) {
    return this.portals.find((portal) => portal.portalId === portalId);
  }

  getPortal(index) {
    if (!this.portals || this.portals.length === 0) {
      console.warn('No portals available');
      return null;
    }

    if (index >= 0 && index < this.portals.length) {
      return this.portals[index];
    }

    console.warn(`Portal index ${index} out of range (0-${this.portals.length - 1})`);
    return null;
  }

  getAllPortals() {
    return this.portals;
  }

  getPortalByTarget(targetMap) {
    return this.portals.find((portal) => portal.targetMap === targetMap);
  }

  getNearestPortal(x, y) {
    if (this.portals.length === 0) return null;

    let nearest = this.portals[0];
    let minDistance = Phaser.Math.Distance.Between(x, y, nearest.x, nearest.y);

    for (let i = 1; i < this.portals.length; i++) {
      const distance = Phaser.Math.Distance.Between(x, y, this.portals[i].x, this.portals[i].y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = this.portals[i];
      }
    }

    return nearest;
  }

  getGroundY() {
    const { height } = this.getScaledMapSize();

    // 자동 모드: collision ground의 상단
    if (!this.config.mapPath) {
      return height - this.AUTO_CONFIG.COLLISION_HEIGHT;
    }

    // 기존 설정 사용
    const groundHeight = this.config.collision?.groundHeight || 200;
    return height - groundHeight;
  }

  getSafeSpawnPosition(x, offsetY = 50) {
    const groundY = this.getGroundY();
    return {
      x: x,
      y: groundY - offsetY, // 땅 위 offsetY px
    };
  }

  update(player) {
    this.portals.forEach((portal) => portal.update(player));
  }

  addPlayer(playerSprite) {
    if (!playerSprite || !playerSprite.body) return false;
    playerSprite.setDepth(this.config.depths?.player || 50);
    return this.addEntityCollision(playerSprite, 'Player');
  }

  addEnemy(enemySprite) {
    if (!enemySprite) {
      console.warn('❌ Enemy sprite is null');
      return false;
    }

    // Physics body가 없으면 추가
    if (!enemySprite.body) {
      this.scene.physics.add.existing(enemySprite);
    }

    if (!enemySprite.body) {
      console.error('❌ Failed to create physics body for enemy');
      return false;
    }

    // ✅ Physics 설정 강화
    enemySprite.body.setAllowGravity(true);
    enemySprite.body.setCollideWorldBounds(true);
    enemySprite.body.setGravityY(500); // 중력 증가
    enemySprite.body.setVelocityY(0); // 초기 속도 0

    enemySprite.setDepth(this.config.depths?.enemy || this.config.depths?.player || 50);

    const collisionResult = this.addEntityCollision(enemySprite, 'Enemy');

    console.log('✅ Enemy added:', {
      position: { x: enemySprite.x, y: enemySprite.y },
      bodyY: enemySprite.body.y,
      groundY: this.collisionGround.y,
      worldHeight: this.scene.physics.world.bounds.height,
    });

    return collisionResult;
  }

  addEntityCollision(entitySprite) {
    if (!this.collisionGround) return false;

    entitySprite.body.setAllowGravity(true);
    entitySprite.body.setCollideWorldBounds(true);
    const groundCollider = this.scene.physics.add.collider(entitySprite, this.collisionGround);
    this.entityColliders.push(groundCollider);

    return groundCollider;
  }
}
