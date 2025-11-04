export const MAPS = {
  cave: {
    key: 'cave',
    name: 'Parallax Cave',
    mapScale: 1, // 🔹 원본 크기
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
      x: 'center',
      y: 'bottom', //
      offsetY: -80, //
    },
    gravity: 800,
    playerScale: 2,
  },

  forest: {
    key: 'forest',
    name: 'Dark Forest',
    mapScale: 3, // 🔹 3배 확대
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
      key: 'forest_collision',
      path: '/assets/map/forest/10.png',
    },
    spawn: {
      x: 'center', //
      y: 'bottom',
      offsetY: -80, //
    },
    gravity: 800,
    playerScale: 2,
  },

  dungeon: {
    key: 'dungeon',
    name: 'Ancient Dungeon',
    mapScale: 2, // 🔹 2배 확대
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
  },
};
