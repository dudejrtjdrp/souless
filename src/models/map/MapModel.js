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
    this.underSolidRect = null;
    this.backgroundLayers = []; // 배경 레이어들 저장

    // 자동 설정용 상수
    this.AUTO_CONFIG = {
      TARGET_HEIGHT: this.scene.scale.height * 1.4,
      COLLISION_HEIGHT: 200,
      DEFAULT_CAMERA_OFFSET_Y: 350,
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
    if (this.config.mapPath) {
      this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
    } else {
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

    // ⭐ underSolidRectangle은 collision ground 생성 후에 만듦
    this.createUnderSolidRectangle();

    const spawn = this.calculateSpawn();

    this.createPortals();

    return {
      spawn,
      collisionGround: this.collisionGround,
      collisionLayer: this.collisionLayer,
      portals: this.portals,
      underSolidRect: this.underSolidRect, // ⭐ 추가
    };
  }

  createTilemap() {
    if (this.config.mapPath) {
      this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });
    } else {
      this.tiledMap = {
        widthInPixels: 0,
        heightInPixels: this.AUTO_CONFIG.TARGET_HEIGHT,
      };
    }
  }

  /**
   * 🎯 레이어 자동 스케일링
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

    const scale = this.AUTO_CONFIG.TARGET_HEIGHT / originalHeight;
    const scaledWidth = originalWidth * scale;

    this.tiledMap.widthInPixels = scaledWidth;
    this.tiledMap.heightInPixels = this.AUTO_CONFIG.TARGET_HEIGHT;

    this.config.autoScale = scale;
    this.config.mapScale = 1;
  }

  /**
   * 🎨 하단 Solid Rectangle 생성
   * - 배경보다 앞에 배치 (배경 레이어들을 가림)
   * - 배경 레이어들을 y값만큼 위로 이동
   */
  createUnderSolidRectangle() {
    const underConfig = this.config.underSolidRectangle;
    if (!underConfig) return;

    const { width, height } = this.getScaledMapSize();
    const rectHeight = underConfig.y || 100;
    const color = underConfig.color || '#000000';

    const colorValue = parseInt(color.replace('#', ''), 16);

    // 하단에 solid rectangle 생성
    this.underSolidRect = this.scene.add.rectangle(
      width / 2,
      height - rectHeight / 2,
      width,
      rectHeight,
      colorValue,
      1, // 완전 불투명
    );

    // ⭐ 배경보다 앞에, 하지만 collision/player보다는 뒤에
    this.underSolidRect.setDepth(45); // tilemapStart(50) 바로 아래
    this.underSolidRect.setScrollFactor(1);
    this.underSolidRect.setOrigin(0.5, 0.5);

    console.log(`✅ Created underSolidRectangle:`, {
      x: this.underSolidRect.x,
      y: this.underSolidRect.y,
      width: width,
      height: rectHeight,
      color: color,
      depth: this.underSolidRect.depth,
      visible: this.underSolidRect.visible,
    });
  }

  /**
   * 🎯 배경 레이어들을 위로 이동 (MapView에서 호출)
   * @param {Array} layers - 배경 레이어 이미지 객체들
   */
  adjustBackgroundLayers(layers) {
    const underConfig = this.config.underSolidRectangle;
    if (!underConfig || !layers) return;

    const offsetY = underConfig.y || 100;

    layers.forEach((layer) => {
      layer.y -= offsetY; // 위로 이동
    });
  }

  addTilesets() {
    if (this.tiledMap && this.tiledMap.addTilesetImage) {
      return this.config.tilesets.map(({ nameInTiled, key }) =>
        this.tiledMap.addTilesetImage(nameInTiled, key),
      );
    }
    return [];
  }

  setupWorldBounds() {
    const { width, height } = this.getScaledMapSize();

    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);

    if (
      this.scene.physics.world.bounds.width !== width ||
      this.scene.physics.world.bounds.height !== height
    ) {
      console.error('❌ Physics world bounds mismatch!');
      this.scene.physics.world.setBounds(0, 0, width, height);
    }
  }

  getScaledMapSize() {
    if (!this.config.mapPath) {
      return {
        width: this.tiledMap.widthInPixels,
        height: this.tiledMap.heightInPixels,
      };
    }

    return {
      width: this.tiledMap.widthInPixels * this.config.mapScale,
      height: this.tiledMap.heightInPixels * this.config.mapScale,
    };
  }

  /**
   * 🎯 스폰 위치 계산
   * - collision ground 위에 확실히 생성
   */
  calculateSpawn() {
    const { width, height } = this.getScaledMapSize();
    const groundHeight = this.AUTO_CONFIG.COLLISION_HEIGHT;

    // ⭐ collision ground의 상단 위치
    const groundTopY = height - groundHeight;

    if (!this.config.mapPath) {
      // ⭐ collision ground 위 150px에 스폰 (캐릭터가 충분히 위에서 시작)
      const spawnY = groundTopY - 150;

      console.log('✅ Auto spawn calculated:', {
        groundTopY,
        spawnY,
        heightDifference: groundTopY - spawnY,
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

    // ⭐ spawnY가 collision ground 안에 있으면 위로 이동
    if (spawnY > groundTopY - 100) {
      spawnY = groundTopY - 150;
    }

    return { x: spawnX, y: spawnY };
  }

  /**
   * 🎯 강화된 Collision Ground 생성
   */
  createFixedCollisionGround() {
    const { width, height } = this.getScaledMapSize();
    const groundHeight = this.AUTO_CONFIG.COLLISION_HEIGHT;
    const groundY = height - groundHeight / 2;

    if (!this.config.mapPath && !this.config.collision) {
      this.collisionGround = this.scene.add.rectangle(
        width / 2,
        groundY,
        width,
        groundHeight,
        0x00ff00,
        this.debug ? 0.3 : 0,
      );
    } else {
      const collisionHeight = this.config.collision?.groundHeight || 200;
      const collisionY = height - collisionHeight / 2;

      this.collisionGround = this.scene.add.rectangle(
        width / 2,
        collisionY,
        width,
        collisionHeight,
        0x00ff00,
        this.debug ? 0.3 : 0,
      );
    }

    // ⭐ Physics body 설정 강화
    this.scene.physics.add.existing(this.collisionGround, true);

    if (this.collisionGround.body) {
      this.collisionGround.body.immovable = true;
      this.collisionGround.body.moves = false;
      this.collisionGround.body.setSize(width, groundHeight);
      this.collisionGround.body.updateFromGameObject();
      this.collisionGround.body.mass = 999999;
      this.collisionGround.body.pushable = false;

      console.log('✅ Collision ground created:', {
        x: this.collisionGround.x,
        y: this.collisionGround.y,
        topY: this.collisionGround.y - groundHeight / 2,
        bottomY: this.collisionGround.y + groundHeight / 2,
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

    if (!this.config.mapPath) {
      return height - this.AUTO_CONFIG.COLLISION_HEIGHT;
    }

    const groundHeight = this.config.collision?.groundHeight || 200;
    return height - groundHeight;
  }

  /**
   * 🎯 안전한 스폰 위치 계산
   * - collision ground 위에 확실히 생성되도록 보장
   */
  getSafeSpawnPosition(x, offsetY = 150) {
    const groundY = this.getGroundY();
    return {
      x: x,
      y: groundY - offsetY, // ⭐ collision 영역보다 150px 위
    };
  }

  update(player) {
    this.portals.forEach((portal) => portal.update(player));
  }

  /**
   * 🎯 플레이어 추가 (collision ground 위에 확실히 배치)
   */
  addPlayer(playerSprite) {
    if (!playerSprite || !playerSprite.body) {
      console.error('❌ Player sprite has no physics body');
      return false;
    }

    // ⭐ 플레이어를 collision ground 위로 강제 이동
    const safePos = this.getSafeSpawnPosition(playerSprite.x, 150);
    playerSprite.setPosition(safePos.x, safePos.y);

    console.log('✅ Player positioned:', {
      x: playerSprite.x,
      y: playerSprite.y,
      groundY: this.getGroundY(),
      difference: this.getGroundY() - playerSprite.y,
    });

    playerSprite.setDepth(this.config.depths?.player || 100);

    // ⭐ Physics 설정 강화
    playerSprite.body.setAllowGravity(true);
    playerSprite.body.setCollideWorldBounds(true);
    playerSprite.body.setBounce(0);
    playerSprite.body.setVelocityY(0); // ⭐ 초기 속도 0

    return this.addEntityCollision(playerSprite, 'Player');
  }

  /**
   * 🎯 적 추가 (collision ground 위에 확실히 배치)
   */
  addEnemy(enemySprite) {
    if (!enemySprite) {
      console.warn('❌ Enemy sprite is null');
      return false;
    }

    if (!enemySprite.body) {
      this.scene.physics.add.existing(enemySprite);
    }

    if (!enemySprite.body) {
      console.error('❌ Failed to create physics body for enemy');
      return false;
    }

    // ⭐ 적을 collision ground 위로 강제 이동
    const safePos = this.getSafeSpawnPosition(enemySprite.x, 150);
    enemySprite.setPosition(safePos.x, safePos.y);

    // ⭐ Physics 설정 강화
    enemySprite.body.setAllowGravity(true);
    enemySprite.body.setCollideWorldBounds(true);
    enemySprite.body.setGravityY(800);
    enemySprite.body.setVelocityY(0);
    enemySprite.body.setBounce(0);
    enemySprite.body.setMass(1);

    enemySprite.setDepth(this.config.depths?.enemy || 90);

    const collisionResult = this.addEntityCollision(enemySprite, 'Enemy');

    return collisionResult;
  }

  /**
   * 🎯 강화된 Entity Collision 추가
   */
  addEntityCollision(entitySprite, entityType = 'Entity') {
    if (!this.collisionGround) {
      console.error('❌ No collision ground available');
      return false;
    }

    entitySprite.body.setAllowGravity(true);
    entitySprite.body.setCollideWorldBounds(true);

    const groundCollider = this.scene.physics.add.collider(
      entitySprite,
      this.collisionGround,
      null,
      null,
      this,
    );

    if (groundCollider) {
      groundCollider.active = true;
      this.entityColliders.push(groundCollider);
    }

    return groundCollider;
  }

  /**
   * 🎯 모든 collider 상태 확인 (디버그용)
   */
  checkColliders() {
    this.entityColliders.forEach((collider, i) => {
      console.log(`Collider ${i}:`, {
        active: collider.active,
        object1: collider.object1?.constructor?.name,
        object2: collider.object2?.constructor?.name,
      });
    });
  }
}
