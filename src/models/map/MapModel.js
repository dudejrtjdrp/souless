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
      console.log(`⚠️ No tilemap for ${this.mapKey}, using layers only`);
    }
  }

  loadTilesets() {
    this.config.tilesets.forEach(({ key, imagePath }) => {
      this.scene.load.image(key, imagePath);
    });
  }

  create() {
    this.createTilemap();
    this.addTilesets();
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
      // 타일맵 없이 빈 객체 생성
      this.tiledMap = {
        widthInPixels: 3200, // 기본 너비
        heightInPixels: 2400, // 기본 높이
      };
    }
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
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);
  }

  getScaledMapSize() {
    return {
      width: this.tiledMap.widthInPixels * this.config.mapScale,
      height: this.tiledMap.heightInPixels * this.config.mapScale,
    };
  }

  calculateSpawn() {
    const { width, height } = this.getScaledMapSize();
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

    if (this.collisionGround.body) {
      this.collisionGround.body.immovable = true;
      this.collisionGround.body.moves = false;
    }

    this.collisionGround.setDepth(this.config.depths.collision || 10);
  }

  createPortals() {
    if (!this.config.portals) return;

    this.config.portals.forEach((portalData) => {
      // 🆕 포탈 데이터 객체 전달 (ID 포함)
      const portal = new Portal(this.scene, portalData);
      this.portals.push(portal);
    });

    console.log(`✅ Created ${this.portals.length} portals for map: ${this.mapKey}`);
  }

  getPortalById(portalId) {
    console.log(this.getPortalById);
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
    if (!playerSprite || !playerSprite.body) return false;
    playerSprite.setDepth(this.config.depths.player || 50);
    return this.addEntityCollision(playerSprite, 'Player');
  }

  addEnemy(enemySprite) {
    if (!enemySprite || !enemySprite.body) return false;
    enemySprite.setDepth(this.config.depths.enemy || this.config.depths.player || 50);
    return this.addEntityCollision(enemySprite, 'Enemy');
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
