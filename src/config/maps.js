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
    },
    // 🟢 적 관련 설정
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 10,
      maxCount: 15,
      respawnInterval: 5000, // ms
      yFixed: 1800, // 바닥 고정
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
      tilemapStart: -100,
      player: 100,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 10,
      maxCount: 15,
      respawnInterval: 5000, // ms
      yFixed: 1800, // 바닥 고정
      patrolRangeX: 100,
      minPlayerDistance: 200, // 리젠 시 플레이어 근처 피하기
    },
  },

  dungeon: {
    key: 'dungeon',
    name: 'Ancient Dungeon',
    mapScale: 2,
    mapPath: '/assets/map/dungeon/dungeon_map.json',
    tilesets: [
      {
        key: 'dungeon_tiles',
        imagePath: '/assets/map/dungeon/dungeon_tiles.png',
        nameInTiled: 'DungeonTiles',
      },
    ],
    layerNames: ['Background', 'Collision', 'Foreground'],
    layers: [
      { key: 'dungeon_layer1', path: '/assets/map/dungeon/1.png' },
      { key: 'dungeon_layer2', path: '/assets/map/dungeon/2.png' },
    ],
    collision: {
      key: 'dungeon_collision',
      path: '/assets/map/dungeon/collision.png',
    },
    spawn: {
      x: 100,
      y: 'bottom',
      offsetY: -80,
    },
    gravity: 1000,
    playerScale: 1.5,
    depths: {
      backgroundStart: -100,
      tilemapStart: 0,
      player: 100,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 10,
      maxCount: 15,
      respawnInterval: 5000, // ms
      yFixed: 1800, // 바닥 고정
      patrolRangeX: 100,
      minPlayerDistance: 200, // 리젠 시 플레이어 근처 피하기
    },
  },
};
