import Phaser from 'phaser';

export default class MapModel {
  constructor(scene, mapKey, config, debug = false) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.config = config;
    this.debug = debug;

    this.tiledMap = null;
    this.collisionGround = null;
    this.collisionLayer = null; // Tiled Collision 레이어
    this.entityColliders = []; // 충돌 추적
  }

  preload() {
    this.loadMapJSON();
    this.loadTilesets();
  }

  loadMapJSON() {
    this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
  }

  loadTilesets() {
    this.config.tilesets.forEach(({ key, imagePath }) => {
      this.scene.load.image(key, imagePath);
    });
  }

  create() {
    this.createTilemap();
    const tilesets = this.addTilesets();
    // this.createAllLayers(tilesets);
    this.setupWorldBounds();
    this.createFixedCollisionGround();
    const spawn = this.calculateSpawn();

    return {
      spawn,
      collisionGround: this.collisionGround,
      collisionLayer: this.collisionLayer,
    };
  }

  createTilemap() {
    this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });
  }

  addTilesets() {
    return this.config.tilesets.map(({ nameInTiled, key }) =>
      this.tiledMap.addTilesetImage(nameInTiled, key),
    );
  }

  createLayer(layerName, index, tilesets, cameraWidth, cameraHeight) {
    const layer = this.tiledMap.createLayer(layerName, tilesets);
    if (!layer) return;

    layer.setScale(this.config.mapScale);

    // Collision 레이어 처리
    if (layerName === 'Collision') {
      layer.setVisible(false);
      this.collisionLayer = layer;
      // 모든 타일에 충돌 활성화
      layer.setCollisionByExclusion([-1]);
    }

    if (layerName === 'Background') {
      this.createBackgroundImage(index, cameraWidth, cameraHeight, layer);
    }
  }

  createBackgroundImage(index, cameraWidth, cameraHeight, layer = null) {
    const imageConfig = this.config.layers[index];
    if (!imageConfig) return;

    const bg = this.scene.add.image(0, 0, imageConfig.key).setOrigin(0, 0);
    const scale = this.calculateBackgroundScale(bg, cameraWidth, cameraHeight);

    bg.setScale(scale);
    bg.setScrollFactor(0);
    bg.setDepth(this.config.depths.backgroundStart + index * 10);

    const scaledHeight = bg.height * scale;
    bg.y = cameraHeight - scaledHeight;
  }

  calculateBackgroundScale(bg, cameraWidth, cameraHeight) {
    const scaleY = cameraHeight / bg.height;
    const scaledWidth = bg.width * scaleY;
    return scaledWidth < cameraWidth ? cameraWidth / bg.width : scaleY;
  }

  setupWorldBounds() {
    const { width, height } = this.getScaledMapSize();
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);
  }

  getScaledMapSize() {
    return {
      width: this.tiledMap.widthInPixels * this.config.mapScale,
      height: this.tiledMap.heightInPixels * this.config.mapScale,
    };
  }

  getPortal() {
    return this.portals || [];
  }

  calculateSpawn() {
    const { width, height } = this.getScaledMapSize();
    const spawnX = this.calculateSpawnX(width);
    const spawnY = this.config.spawn.y;
    return { x: spawnX, y: spawnY };
  }

  calculateSpawnX(width) {
    const { x } = this.config.spawn;
    const { mapScale } = this.config;
    if (x === 'left') return 50 * mapScale;
    if (x === 'right') return width - 50 * mapScale;
    return x;
  }

  createFixedCollisionGround() {
    const { width, height } = this.getScaledMapSize();
    const groundHeight = this.config.collision.groundHeight;
    const groundY = height - groundHeight / 2;

    this.collisionGround = this.scene.add.rectangle(
      width / 2,
      groundY,
      width,
      groundHeight,
      0x00ff00,
      0,
    );

    this.scene.physics.add.existing(this.collisionGround, true);

    // 명시적으로 static body 설정
    if (this.collisionGround.body) {
      this.collisionGround.body.immovable = true;
      this.collisionGround.body.moves = false;
    }

    this.collisionGround.setDepth(this.config.depths.collision || 10);
  }

  // 플레이어 추가
  addPlayer(playerSprite) {
    if (!playerSprite || !playerSprite.body) {
      return false;
    }

    playerSprite.setDepth(this.config.depths.player || 50);
    return this.addEntityCollision(playerSprite, 'Player');
  }

  // 적 추가
  addEnemy(enemySprite) {
    if (!enemySprite || !enemySprite.body) {
      return false;
    }

    enemySprite.setDepth(this.config.depths.enemy || this.config.depths.player || 50);
    return this.addEntityCollision(enemySprite, 'Enemy');
  }

  // 엔티티 충돌 추가 (통합)
  addEntityCollision(entitySprite, entityType = 'Entity') {
    if (!this.collisionGround) {
      return false;
    }

    // 물리 설정
    entitySprite.body.setAllowGravity(true);
    entitySprite.body.setCollideWorldBounds(true); // body에 적용

    // 1. CollisionGround와 충돌
    const groundCollider = this.scene.physics.add.collider(entitySprite, this.collisionGround);
    this.entityColliders.push(groundCollider);

    // 2. Collision 레이어와 충돌 (있으면)
    if (this.collisionLayer) {
      const layerCollider = this.scene.physics.add.collider(entitySprite, this.collisionLayer);
      this.entityColliders.push(layerCollider);
    }

    return true;
  }

  createPortals() {
    this.portals = [];

    if (!this.config.portals) return;

    this.config.portals.forEach((p) => {
      // 포탈은 플레이어와 충돌 체크용 Rectangle
      const portal = this.scene.add.rectangle(
        p.x,
        p.y,
        p.width,
        p.height,
        0x00ff00,
        0.5, // 디버그용 투명도
      );
      this.scene.physics.add.existing(portal, true); // 정적 바디

      portal.targetMap = p.targetMap;
      portal.targetSpawn = p.targetSpawn;

      this.portals.push(portal);
    });
  }
  destroy() {
    this.entityColliders.forEach((collider) => {
      if (collider) {
        collider.destroy();
      }
    });
    this.entityColliders = [];

    this.tiledMap?.destroy();
    this.collisionGround?.destroy();
    this.collisionLayer = null;
    this.collisionGround = null;
  }
}
