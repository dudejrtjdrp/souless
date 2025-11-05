import Phaser from 'phaser';

export default class MapModel {
  constructor(scene, mapKey, config, debug = false) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.config = config;
    this.debug = debug;

    this.tiledMap = null;
    this.collisionLayer = null;
    this.debugGraphics = null;
  }

  preload() {
    this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
    this.config.tilesets.forEach((tileset) => {
      this.scene.load.image(tileset.key, tileset.imagePath);
    });
  }

  create() {
    this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });

    const depths = this.config.depths || {
      backgroundStart: 0,
      tilemapStart: -100,
      player: 100,
      ui: 1000,
    };

    const tilesets = [];
    this.config.tilesets.forEach((tileset) => {
      tilesets.push(this.tiledMap.addTilesetImage(tileset.nameInTiled, tileset.key));
    });

    let collisionLayer = null;

    this.config.layerNames.forEach((layerName, index) => {
      const layer = this.tiledMap.createLayer(layerName, tilesets);
      if (!layer) return;

      layer.setScale(this.config.mapScale);
      layer.setDepth(depths.tilemapStart + index);

      if (layerName === 'Collision') {
        collisionLayer = layer;
        layer.setCollisionByExclusion([-1]);
        layer.setVisible(false);
      }
    });

    this.collisionLayer = collisionLayer;

    const widthInPixels = this.tiledMap.widthInPixels * this.config.mapScale;
    const heightInPixels = this.tiledMap.heightInPixels * this.config.mapScale;
    this.scene.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);
    this.scene.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);

    const spawnX =
      this.config.spawn.x === 'left'
        ? 50 * this.config.mapScale
        : this.config.spawn.x === 'right'
        ? widthInPixels - 50 * this.config.mapScale
        : this.config.spawn.x;

    const spawnY =
      this.config.spawn.y === 'bottom'
        ? heightInPixels - 50 * this.config.mapScale
        : this.config.spawn.y;

    return {
      spawn: { x: spawnX, y: spawnY },
      collisionLayer: this.collisionLayer,
    };
  }

  addPlayerCollision(playerSprite) {
    if (this.collisionLayer) {
      this.collisionLayer.setVisible(false);
      this.collisionLayer.y += 180;
      this.scene.physics.add.collider(playerSprite, this.collisionLayer);

      if (this.debugGraphics) {
        this.debugGraphics.destroy();
        this.debugGraphics = null;
      }
    }
  }

  destroy() {
    if (this.tiledMap) this.tiledMap.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
    this.collisionLayer = null;
  }
}
