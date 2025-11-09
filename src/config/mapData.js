// src/config/mapData.js
import { generateMapPortals } from './portalData.js';

export const MAPS = {
  cave: {
    key: 'cave',
    name: 'Parallax Cave',
    mapScale: 1,
    mapPath: '/assets/map/parallax_cave/map.json',
    camera: {
      offsetY: 150,
    },
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
      groundHeight: 200,
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
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 10,
      maxCount: 15,
      respawnInterval: 5000,
      yFixed: 2150,
      patrolRangeX: 100,
      minPlayerDistance: 200,
    },
    portals: generateMapPortals('cave'),
  },

  forest: {
    key: 'forest',
    name: 'Dark Forest',
    mapScale: 3,
    mapPath: '/assets/map/forest/forest_map.tmj',
    camera: {
      offsetY: 150,
    },
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
      groundHeight: 200,
    },
    spawn: {
      x: 'left',
      y: 2170,
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      yFixed: 2169,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('forest'),
  },

  dark_cave: {
    key: 'dark_cave',
    name: 'Dark cave',
    mapScale: 4,
    mapPath: '/assets/map/dark_cave/dark_cave_map.tmj',
    camera: {
      offsetY: 0,
    },
    tilesets: [
      {
        key: 'dark_cave_tileset',
        nameInTiled: 'dark_cave_tileset',
        imagePath: '/assets/map/dark_cave/parallax-demon-woods-close-trees.png',
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
      key: 'dark_cave_tileset',
      path: '/assets/map/dark_cave/parallax-demon-woods-close-trees.png',
      groundHeight: 100,
    },
    spawn: {
      x: 'left',
      y: 893,
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Goblin', 'Bat', 'PurpleMonkey'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      yFixed: 895,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('dark_cave'),
  },
};

// 🎯 디버그: 포탈 정보 출력 (개발 중)
if (import.meta.env.DEV) {
  console.log('=== Map Portal Info ===');
  console.log('Cave portals:', MAPS.cave.portals);
  console.log('Forest portals:', MAPS.forest.portals);
  console.log('Dark cave portals:', MAPS.dark_cave.portals);
  console.log('======================');
}
