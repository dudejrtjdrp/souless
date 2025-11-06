export const MAPS = {
  cave: {
    key: 'cave',
    name: 'Parallax Cave',
    mapScale: 1,
    mapPath: '/assets/map/parallax_cave/cave_map.json',
    tilesets: [
      {
        key: 'cave_tiles',
        imagePath: '/assets/map/parallax_cave/cave_tiles.png',
        nameInTiled: 'CaveTiles',
      },
    ],
    layerNames: ['Background1', 'Background2', 'Midground', 'Collision', 'Foreground'],
    layers: [
      { key: 'cave_layer1', path: '/assets/map/parallax_cave/1.png' },
      { key: 'cave_layer2', path: '/assets/map/parallax_cave/2.png' },
      { key: 'cave_layer3', path: '/assets/map/parallax_cave/3fx.png' },
      { key: 'cave_layer4', path: '/assets/map/parallax_cave/4.png' },
      { key: 'cave_layer5', path: '/assets/map/parallax_cave/5.png' },
      { key: 'cave_layer6', path: '/assets/map/parallax_cave/6fx.png' },
      { key: 'cave_layer7', path: '/assets/map/parallax_cave/7.png' },
      { key: 'cave_layer8', path: '/assets/map/parallax_cave/8fx.png' },
      { key: 'cave_layer9', path: '/assets/map/parallax_cave/9.png' },
    ],
    collision: {
      key: 'cave_collision',
      path: '/assets/map/parallax_cave/9.png',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
      offsetY: -80,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: -100,
      tilemapStart: 0,
      player: 100,
      ui: 1000,
      enemy: 100,
    },
    // 🟢 적 관련 설정
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 10,
      maxCount: 15,
      respawnInterval: 5000, // ms
      yFixed: 2195, // 바닥 고정
      patrolRangeX: 100,
      minPlayerDistance: 200, // 리젠 시 플레이어 근처 피하기
    },
  },

  forest: {
    key: 'forest',
    name: 'Dark Forest',
    mapScale: 3,
    mapPath: '/assets/map/forest/forest_map.tmj',
    tilesets: [
      {
        key: 'forest_tileset',
        nameInTiled: 'forest_map',
        imagePath: '/assets/map/forest/forest_tileset.png',
      },
    ],
    layerNames: ['Background', 'Ground', 'Collision'],
    layers: [
      { key: 'forest_layer1', path: '/assets/map/forest/0.png' },
      { key: 'forest_layer2', path: '/assets/map/forest/1.png' },
      { key: 'forest_layer3', path: '/assets/map/forest/2.png' },
      { key: 'forest_layer4', path: '/assets/map/forest/3.png' },
      { key: 'forest_layer5', path: '/assets/map/forest/4.png' },
      { key: 'forest_layer6', path: '/assets/map/forest/5.png' },
      { key: 'forest_layer7', path: '/assets/map/forest/6.png' },
      { key: 'forest_layer8', path: '/assets/map/forest/7.png' },
      { key: 'forest_layer9', path: '/assets/map/forest/8.png' },
      { key: 'forest_layer10', path: '/assets/map/forest/9.png' },
      { key: 'forest_layer11', path: '/assets/map/forest/10.png' },
      { key: 'forest_layer12', path: '/assets/map/forest/11.png' },
    ],
    collision: {
      key: 'forest_tileset',
      path: '/assets/map/forest/forest_tileset.png',
    },
    spawn: {
      x: 'left',
      y: 1800,
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50, // 타일맵은 background 위
      player: 100,
      enemy: 90, // enemy는 타일보다 위지만 player보다 약간 낮게
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000, // ms
      yFixed: 2150, // 바닥 고정
      patrolRangeX: 100,
      minPlayerDistance: 100, // 리젠 시 플레이어 근처 피하기
    },
  },

  dark_cave: {
    key: 'dark_cave',
    name: 'Dark cave',
    mapScale: 3,
    mapPath: '/assets/map/dark_cave/forest_map.tmj',
    tilesets: [
      {
        key: 'forest_tileset',
        nameInTiled: 'forest_map',
        imagePath: '/assets/map/dark_cave/forest_tileset.png',
      },
    ],
    layerNames: ['Background', 'Ground', 'Collision'],
    layers: [
      { key: 'dark_cave_layer1', path: '/assets/map/dark_cave/parallax-demon-woods-bg.png' },
      { key: 'dark_cave_layer2', path: '/assets/map/dark_cave/parallax-demon-woods-far-trees.png' },
      { key: 'dark_cave_layer3', path: '/assets/map/dark_cave/parallax-demon-woods-mid-trees.png' },
      {
        key: 'dark_cave_layer4',
        path: '/assets/map/dark_cave/parallax-demon-woods-close-trees.png',
      },
    ],
    collision: {
      key: 'forest_tileset',
      path: '/assets/map/dark_cave/forest_tileset.png',
    },
    spawn: {
      x: 'left',
      y: 1800,
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50, // 타일맵은 background 위
      player: 100,
      enemy: 90, // enemy는 타일보다 위지만 player보다 약간 낮게
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000, // ms
      yFixed: 2150, // 바닥 고정
      patrolRangeX: 100,
      minPlayerDistance: 100, // 리젠 시 플레이어 근처 피하기
    },
  },
};
