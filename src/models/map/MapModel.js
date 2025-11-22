import Phaser from 'phaser';
import Portal from './Portal.js';

export default class MapModel {
  constructor(scene, mapKey, config, debug = false) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.config = config;
    this.debug = debug;

    this.collisionGround = null;
    this.entityColliders = [];
    this.portals = [];
    this.underSolidRect = null;
    this.backgroundLayers = [];

    // 자동 설정용 상수
    this.AUTO_CONFIG = {
      COLLISION_HEIGHT: 200,
      DEFAULT_SPAWN_OFFSET_Y: 200,
    };

    // 맵 크기 (autoScale 적용 후 저장됨)
    this.mapWidth = 0;
    this.mapHeight = 0;

    // 반복 횟수 (기본값 1)
    this.repeatCount = this.config.repeatCount || 1;
  }

  preload() {
    // 포탈 애니메이션 이미지 로드
    for (let i = 1; i <= 16; i++) {
      this.scene.load.image(`holy_vfx_02_${i}`, `assets/portal/Holy VFX 02 ${i}.png`);
    }
  }

  create() {
    // 레이어 자동 스케일링 (화면 높이에 맞춤)
    this.autoScaleLayers();

    this.setupWorldBounds();
    this.createFixedCollisionGround();
    this.createUnderSolidRectangle();

    const spawn = this.calculateSpawn();
    this.createPortals();

    return {
      spawn,
      collisionGround: this.collisionGround,
      portals: this.portals,
      underSolidRect: this.underSolidRect,
    };
  }

  /**
   * 🎨 레이어 자동 스케일링 - 화면 높이에 맞춤 (mapScale 있으면 우선 적용)
   * 반복 횟수만큼 맵 너비 확장
   */
  autoScaleLayers() {
    if (!this.config.layers || this.config.layers.length === 0) {
      console.error('❌ No layers defined');
      return;
    }

    const firstLayerKey = this.config.layers[0].key;
    const firstLayerTexture = this.scene.textures.get(firstLayerKey);

    if (!firstLayerTexture || !firstLayerTexture.source[0]) {
      console.error(`❌ Cannot find texture: ${firstLayerKey}`);
      return;
    }

    const originalWidth = firstLayerTexture.source[0].width;
    const originalHeight = firstLayerTexture.source[0].height;
    const screenHeight = this.scene.scale.height;

    let scale;
    let scaledWidth;
    let scaledHeight;

    // mapScale이 설정되어 있으면 우선 사용
    if (this.config.mapScale) {
      scale = this.config.mapScale;
      scaledWidth = originalWidth * scale;
      scaledHeight = originalHeight * scale;
    } else {
      // mapScale이 없으면 화면 높이에 자동 맞춤
      scale = screenHeight / originalHeight;
      scaledWidth = originalWidth * scale;
      scaledHeight = screenHeight;
    }

    // 🔄 반복 횟수만큼 맵 너비 확장
    const totalWidth = scaledWidth * this.repeatCount;

    // 맵 크기 저장
    this.mapWidth = totalWidth;
    this.mapHeight = scaledHeight;
    this.config.autoScale = scale;
    this.singleLayerWidth = scaledWidth; // 단일 레이어 너비 저장
  }

  /**
   * 🎨 하단 Solid Rectangle 생성 (반복 횟수만큼 확장)
   */
  createUnderSolidRectangle() {
    const underConfig = this.config.underSolidRectangle;
    if (!underConfig) return;

    const rectHeight = underConfig.y || 100;
    const color = underConfig.color || '#000000';
    const colorValue = parseInt(color.replace('#', ''), 16);

    this.underSolidRect = this.scene.add.rectangle(
      this.mapWidth / 2,
      this.mapHeight - rectHeight / 2,
      this.mapWidth, // 전체 맵 너비
      rectHeight,
      colorValue,
      1,
    );

    this.underSolidRect.setDepth(45);
    this.underSolidRect.setScrollFactor(1);
    this.underSolidRect.setOrigin(0.5, 0.5);
  }

  /**
   * 📦 배경 레이어들 Y축 조정
   * - underSolidRectangle에 의한 자동 조정
   * - layersOffsetY에 의한 수동 조정
   */
  adjustBackgroundLayers(layers) {
    if (!layers) return;

    let totalOffsetY = 0;

    // 1. underSolidRectangle에 의한 자동 오프셋 (위로 이동)
    const underConfig = this.config.underSolidRectangle;
    if (underConfig) {
      const autoOffsetY = underConfig.y || 100;
      totalOffsetY -= autoOffsetY; // 위로 이동 (음수)
    }

    // 2. layersOffsetY에 의한 수동 오프셋
    if (this.config.layersOffsetY !== undefined) {
      totalOffsetY += this.config.layersOffsetY;
    }

    // 3. 레이어들에 오프셋 적용
    if (totalOffsetY !== 0) {
      layers.forEach((layer) => {
        layer.y += totalOffsetY;
      });
    }
  }

  setupWorldBounds() {
    this.scene.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.scene.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
  }

  /**
   * 📍 스폰 위치 계산
   */
  calculateSpawn() {
    const groundHeight = this.AUTO_CONFIG.COLLISION_HEIGHT;
    const groundTopY = this.mapHeight - groundHeight;

    const spawnConfig = this.config.spawn || {};
    const offsetY = spawnConfig.offsetY || this.AUTO_CONFIG.DEFAULT_SPAWN_OFFSET_Y;

    let spawnX = 100;
    if (spawnConfig.x === 'left') {
      spawnX = 100;
    } else if (spawnConfig.x === 'right') {
      spawnX = this.mapWidth - 100; // 전체 맵 너비 기준
    } else if (spawnConfig.x === 'center') {
      spawnX = this.mapWidth / 2;
    } else if (typeof spawnConfig.x === 'number') {
      spawnX = spawnConfig.x;
    }

    let spawnY = groundTopY - offsetY;
    return { x: spawnX, y: spawnY };
  }

  /**
   * 🧱 Collision Ground 생성 (반복 횟수만큼 확장)
   */
  createFixedCollisionGround() {
    const groundHeight = this.AUTO_CONFIG.COLLISION_HEIGHT;
    const groundY = this.mapHeight - groundHeight / 2;

    this.collisionGround = this.scene.add.rectangle(
      this.mapWidth / 2, // 전체 맵 너비 중앙
      groundY,
      this.mapWidth, // 전체 맵 너비
      groundHeight,
      0x00ff00,
      this.debug ? 0.3 : 0,
    );

    this.scene.physics.add.existing(this.collisionGround, true);

    if (this.collisionGround.body) {
      this.collisionGround.body.immovable = true;
      this.collisionGround.body.moves = false;
      this.collisionGround.body.setSize(this.mapWidth, groundHeight);
      this.collisionGround.body.updateFromGameObject();
      this.collisionGround.body.mass = 999999;
      this.collisionGround.body.pushable = false;
    }

    this.collisionGround.setDepth(this.config.depths?.collision || 10);
  }

  /**
   * 🚪 포탈 생성
   */
  createPortals() {
    if (!this.config.portals) return;

    // collider 윗면 = 맵 높이 - 200(collider 높이)
    const collisionTopY = this.mapHeight - 200;

    this.config.portals.forEach((portalData) => {
      const adjustedData = {
        ...portalData,
        y: collisionTopY - 32,
      };
      const portal = new Portal(this.scene, adjustedData);
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

  update(player) {
    this.portals.forEach((portal) => portal.update(player));
  }

  addPlayer(playerSprite) {
    if (!playerSprite || !playerSprite.body) {
      console.error('❌ Player sprite has no physics body');
      return false;
    }

    playerSprite.setDepth(this.config.depths?.player || 100);
    playerSprite.body.setAllowGravity(true);
    playerSprite.body.setCollideWorldBounds(true);
    playerSprite.body.setBounce(0);
    playerSprite.body.setVelocityY(0);

    return this.addEntityCollision(playerSprite, 'Player');
  }

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

    enemySprite.body.setAllowGravity(true);
    enemySprite.body.setCollideWorldBounds(true);
    enemySprite.body.setGravityY(800);
    enemySprite.body.setVelocityY(0);
    enemySprite.body.setBounce(0);
    enemySprite.body.setMass(1);
    enemySprite.setDepth(this.config.depths?.enemy || 90);

    return this.addEntityCollision(enemySprite, 'Enemy');
  }

  // Entity Collision 추가

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
}
