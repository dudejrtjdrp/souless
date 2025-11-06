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

  // 맵 및 타일셋 로드
  preload() {
    this.loadMapJSON();
    this.loadTilesets();
  }

  // 맵 JSON 파일 로드
  loadMapJSON() {
    this.scene.load.tilemapTiledJSON(this.mapKey, this.config.mapPath);
  }

  // 타일셋 이미지 로드
  loadTilesets() {
    this.config.tilesets.forEach(({ key, imagePath }) => {
      this.scene.load.image(key, imagePath);
    });
  }

  // 타일맵 생성 전체 루틴
  create() {
    this.createTilemap();
    const tilesets = this.addTilesets();
    this.createAllLayers(tilesets);
    this.setupWorldBounds();
    const spawn = this.calculateSpawn();
    return { spawn, collisionLayer: this.collisionLayer };
  }

  // 타일맵 생성
  createTilemap() {
    this.tiledMap = this.scene.make.tilemap({ key: this.mapKey });
  }

  // 타일셋 추가
  addTilesets() {
    return this.config.tilesets.map(({ nameInTiled, key }) =>
      this.tiledMap.addTilesetImage(nameInTiled, key),
    );
  }

  // 모든 레이어 생성
  createAllLayers(tilesets) {
    const camera = this.scene.cameras.main;
    const { width, height } = camera;
    this.config.layerNames.forEach((name, i) => this.createLayer(name, i, tilesets, width, height));
  }

  // 단일 레이어 생성
  createLayer(layerName, index, tilesets, cameraWidth, cameraHeight) {
    const layer = this.tiledMap.createLayer(layerName, tilesets);

    if (!layer && this.config.key === 'dark_cave') {
      this.createBackgroundImage(index, cameraWidth, cameraHeight);
      return;
    }
    if (!layer) return;

    layer.setScale(this.config.mapScale);
    if (layerName === 'Collision') this.setupCollisionLayer(layer);
  }

  // 충돌 레이어 설정
  setupCollisionLayer(layer) {
    layer.setCollisionByExclusion([-1]);
    layer.setVisible(false);
    this.collisionLayer = layer;
  }

  // 배경 이미지 생성
  createBackgroundImage(index, cameraWidth, cameraHeight) {
    const imageConfig = this.config.layers[index];
    if (!imageConfig) return;

    const bg = this.scene.add.image(0, 0, imageConfig.key).setOrigin(0, 0);
    const scale = this.calculateBackgroundScale(bg, cameraWidth, cameraHeight);

    bg.setScale(scale).setScrollFactor(0.3 + index * 0.1);
    bg.setDepth(this.config.depths.backgroundStart + index * 10);
  }

  // 배경 스케일 계산
  calculateBackgroundScale(bg, cameraWidth, cameraHeight) {
    const scaleX = cameraWidth / bg.width;
    const scaleY = cameraHeight / bg.height;
    return Math.max(scaleX, scaleY);
  }

  // 월드 경계 설정
  setupWorldBounds() {
    const { width, height } = this.getScaledMapSize();
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);
  }

  // 스케일된 맵 크기 반환
  getScaledMapSize() {
    return {
      width: this.tiledMap.widthInPixels * this.config.mapScale,
      height: this.tiledMap.heightInPixels * this.config.mapScale,
    };
  }

  // 스폰 위치 계산
  calculateSpawn() {
    const { width, height } = this.getScaledMapSize();
    const spawnX = this.calculateSpawnX(width);
    let spawnY = this.calculateSpawnY(height);
    if (this.collisionLayer) spawnY = this.adjustSpawnYByCollision(spawnY);
    return { x: spawnX, y: spawnY };
  }

  // 스폰 X좌표 계산
  calculateSpawnX(width) {
    const { x } = this.config.spawn;
    const { mapScale } = this.config;
    if (x === 'left') return 50 * mapScale;
    if (x === 'right') return width - 50 * mapScale;
    return x;
  }

  // 스폰 Y좌표 계산
  calculateSpawnY(height) {
    const { y } = this.config.spawn;
    const { mapScale } = this.config;
    if (y === 'bottom') return height - 50 * mapScale;
    return y;
  }

  // 충돌 기반 스폰 Y 보정
  adjustSpawnYByCollision(defaultY) {
    const tiles = this.collisionLayer.getTilesWithin(
      0,
      0,
      this.collisionLayer.width,
      this.collisionLayer.height,
    );
    const firstTile = tiles.find((t) => t.index !== -1);
    if (!firstTile) return defaultY;

    const tileTop = firstTile.getBounds().top + this.collisionLayer.y;
    return tileTop - 32 * (this.config.playerScale || 1) + 227;
  }

  // 플레이어 충돌 추가
  addPlayerCollision(playerSprite) {
    if (!this.collisionLayer) return;
    this.scene.physics.add.collider(playerSprite, this.collisionLayer);
    this.adjustCollisionLayerOffset();
  }

  // 충돌 레이어 오프셋 보정
  adjustCollisionLayerOffset() {
    this.collisionLayer.y += 180;
  }

  // 메모리 해제
  destroy() {
    this.tiledMap?.destroy();
    this.collisionLayer = null;
  }
}
