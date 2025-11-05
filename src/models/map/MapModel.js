import Phaser from 'phaser';

export default class MapModel {
  constructor(scene, mapKey, config, debug = false) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.config = config;
    this.debug = debug;

    this.tiledMap = null;
    this.collisionLayer = null;
  }

  preload() {
    this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
    this.config.tilesets.forEach((tileset) => {
      this.scene.load.image(tileset.key, tileset.imagePath);
    });
  }

  create() {
    this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });

    const tilesets = [];
    this.config.tilesets.forEach((tileset) => {
      tilesets.push(this.tiledMap.addTilesetImage(tileset.nameInTiled, tileset.key));
    });

    let collisionLayer = null;

    this.config.layerNames.forEach((layerName, index) => {
      const layer = this.tiledMap.createLayer(layerName, tilesets);
      if (!layer) return;

      layer.setScale(this.config.mapScale);

      if (layerName === 'Collision') {
        collisionLayer = layer;
        layer.setCollisionByExclusion([-1]);
        layer.setVisible(false); // collision 레이어 안 보이게
      }
    });

    this.collisionLayer = collisionLayer;

    const widthInPixels = this.tiledMap.widthInPixels * this.config.mapScale;
    const heightInPixels = this.tiledMap.heightInPixels * this.config.mapScale;
    this.scene.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);
    this.scene.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);

    // 기본 spawn 위치
    let spawnX =
      this.config.spawn.x === 'left'
        ? 50 * this.config.mapScale
        : this.config.spawn.x === 'right'
        ? widthInPixels - 50 * this.config.mapScale
        : this.config.spawn.x;

    let spawnY =
      this.config.spawn.y === 'bottom'
        ? heightInPixels - 50 * this.config.mapScale
        : this.config.spawn.y;

    // collisionLayer가 있으면 spawnY를 collider 바로 위로
    if (this.collisionLayer) {
      // collisionLayer를 아래로 이동

      // 첫 번째 충돌 타일 기준으로 spawnY 조정
      const tiles = this.collisionLayer.getTilesWithin(
        0,
        0,
        this.collisionLayer.width,
        this.collisionLayer.height,
      );
      const firstTile = tiles.find((tile) => tile.index !== -1);
      if (firstTile) {
        const tileTop = firstTile.getBounds().top + this.collisionLayer.y;
        spawnY = tileTop - 32 * (this.config.playerScale || 1) + 227;
      }
    }

    return {
      spawn: { x: spawnX, y: spawnY },
      collisionLayer: this.collisionLayer,
    };
  }

  addPlayerCollision(playerSprite) {
    if (this.collisionLayer) {
      this.scene.physics.add.collider(playerSprite, this.collisionLayer);
      this.collisionLayer.y += 180;
    }
  }

  destroy() {
    if (this.tiledMap) this.tiledMap.destroy();
    this.collisionLayer = null;
  }
}
