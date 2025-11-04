import Phaser from 'phaser';
import Soul from '../models/characters/SoulModel.js';
import { MAPS } from '../config/maps.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // 🔹 초기화 시 맵 선택
  init(data) {
    this.currentMapKey = data.mapKey || 'forest'; // 기본값: cave
    this.mapConfig = MAPS[this.currentMapKey];
  }

  preload() {
    // 🔹 현재 맵의 레이어들 로드
    this.mapConfig.layers.forEach((layer) => {
      this.load.image(layer.key, layer.path);
    });

    // 🔹 충돌 레이어 로드
    this.load.image(this.mapConfig.collision.key, this.mapConfig.collision.path);

    // 🔹 캐릭터 스프라이트 (공통)
    this.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.physics.world.gravity.y = this.mapConfig.gravity;

    const mapScale = this.mapConfig.mapScale || 1;

    const firstLayerTexture = this.textures.get(this.mapConfig.layers[0].key).getSourceImage();
    const mapWidth = firstLayerTexture.width * mapScale;
    const mapHeight = firstLayerTexture.height * mapScale;

    this.mapConfig.layers.forEach((layer, index) => {
      const img = this.add.image(0, 0, layer.key).setOrigin(0, 0);
      img.setScale(mapScale);
      img.setDepth(index);
    });

    // 🔹 spawn 위치 계산 (고급)
    const spawn = this.mapConfig.spawn;
    let spawnX, spawnY;

    // X 좌표 계산
    if (spawn.x === 'center') {
      spawnX = mapWidth / 2;
    } else if (spawn.x === 'left') {
      spawnX = 100;
    } else if (spawn.x === 'right') {
      spawnX = mapWidth - 100;
    } else {
      spawnX = spawn.x * mapScale;
    }

    // Y 좌표 계산
    if (spawn.y === 'bottom') {
      spawnY = mapHeight + (spawn.offsetY || -50) * mapScale;
    } else if (spawn.y === 'top') {
      spawnY = 100;
    } else if (spawn.y === 'center') {
      spawnY = mapHeight / 2;
    } else {
      spawnY = spawn.y * mapScale;
    }

    const playerScale = this.mapConfig.playerScale || 2;
    this.player = new Soul(this, spawnX, spawnY, playerScale, mapScale);

    this.createCollisionLayer(this.mapConfig.collision.key, mapScale);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }

  createCollisionLayer(collisionKey, mapScale = 1) {
    const collisionTexture = this.textures.get(collisionKey).getSourceImage();
    const { width, height } = collisionTexture;

    const collisionCanvas = this.textures.createCanvas('collisionCanvas', width, height);
    collisionCanvas.draw(0, 0, collisionTexture);
    const ctx = collisionCanvas.getContext();

    this.collisionData = ctx.getImageData(0, 0, width, height);
    this.collisionWidth = width;
    this.collisionHeight = height;

    this.collisionRects = [];
    const step = 4;
    const imgData = this.collisionData.data;
    const processed = new Set();

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const key = `${x},${y}`;
        if (processed.has(key)) continue;

        const i = (y * width + x) * 4;
        const alpha = imgData[i + 3];

        if (alpha > 128) {
          let endX = x + step;
          while (endX < width) {
            const checkI = (y * width + endX) * 4;
            if (imgData[checkI + 3] <= 128) break;
            processed.add(`${endX},${y}`);
            endX += step;
          }

          const rectWidth = endX - x;
          // 🔹 충돌 박스 위치와 크기에도 스케일 적용
          const rect = this.add.rectangle(
            (x + rectWidth / 2) * mapScale,
            (y + step / 2) * mapScale,
            rectWidth * mapScale,
            step * mapScale,
          );
          this.physics.add.existing(rect, true);
          this.physics.add.collider(this.player.sprite, rect);
          this.collisionRects.push(rect);

          processed.add(key);
        }
      }
    }
    collisionCanvas.destroy();
  }

  update(time, delta) {
    this.player.update(time, delta);
  }

  // 🔹 맵 전환 메서드
  changeMap(newMapKey) {
    this.scene.restart({ mapKey: newMapKey });
  }

  createPortals() {
    const portals = [
      { x: 100, y: 500, targetMap: 'forest' },
      { x: 1500, y: 500, targetMap: 'dungeon' },
    ];

    portals.forEach((portal) => {
      const portalSprite = this.physics.add.sprite(portal.x, portal.y, 'portal');
      portalSprite.setImmovable(true);

      this.physics.add.overlap(this.player.sprite, portalSprite, () => {
        this.changeMap(portal.targetMap);
      });
    });
  }
}
