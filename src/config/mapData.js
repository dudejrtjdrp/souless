import { generateMapPortals } from '../utils/PortalHelper';

export const MAPS = {
  cave: {
    key: 'cave',
    name: 'Parallax Cave',
    camera: {
      offsetY: 150,
    },
    mapScale: 1.5,
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
    underSolidRectangle: {
      y: 150,
      color: '#1a1a2e',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('cave'),
  },

  forest: {
    key: 'forest',
    name: 'Forest',
    mapScale: 3,
    camera: {
      offsetY: -100,
    },
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
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('forest'),
  },

  dark_cave: {
    key: 'dark_cave',
    name: 'Dark cave',
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'dark_cave_layer1', path: '/assets/map/dark_cave/parallax-demon-woods-bg.png' },
      { key: 'dark_cave_layer2', path: '/assets/map/dark_cave/parallax-demon-woods-far-trees.png' },
      { key: 'dark_cave_layer3', path: '/assets/map/dark_cave/parallax-demon-woods-mid-trees.png' },
      {
        key: 'dark_cave_layer4',
        path: '/assets/map/dark_cave/parallax-demon-woods-close-trees.png',
      },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('dark_cave'),
  },

  scary_cave: {
    key: 'scary_cave',
    name: 'Scary Cave',
    mapScale: 3,
    layersOffsetY: 450,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'scary_cave_layer1', path: '/assets/map/scary_cave/background1.png' },
      { key: 'scary_cave_layer2', path: '/assets/map/scary_cave/background2.png' },
      { key: 'scary_cave_layer3', path: '/assets/map/scary_cave/background3.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('scary_cave'),
  },

  other_cave: {
    key: 'other_cave',
    name: 'Other Cave',
    mapScale: 2,
    layersOffsetY: 0,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'other_cave_layer3', path: '/assets/map/other_cave/ParallaxCave4.png' },
      { key: 'other_cave_layer3', path: '/assets/map/other_cave/ParallaxCave3.png' },
      { key: 'other_cave_layer2', path: '/assets/map/other_cave/ParallaxCave2.png' },
      { key: 'other_cave_layer1', path: '/assets/map/other_cave/ParallaxCave1.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('other_cave'),
  },

  oakwood: {
    key: 'oakwood',
    name: 'Oakwood',
    mapScale: 6,
    layersOffsetY: 100,
    repeatCount: 2,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'oakwood_layer3', path: '/assets/map/oakwood/background_layer_1.png' },
      { key: 'oakwood_layer3', path: '/assets/map/oakwood/background_layer_2.png' },
      { key: 'oakwood_layer2', path: '/assets/map/oakwood/background_layer_3.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('oakwood'),
  },

  dark: {
    key: 'dark',
    name: 'Dark',
    layersOffsetY: 0,
    repeatCount: 2,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'dark_layer3', path: '/assets/map/dark/background1.png' },
      { key: 'dark_layer3', path: '/assets/map/dark/background2.png' },
      { key: 'dark_layer3', path: '/assets/map/dark/background3.png' },
      { key: 'dark_layer3', path: '/assets/map/dark/background4.png' },
      { key: 'dark_layer2', path: '/assets/map/dark/background5.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: [],
      initialCount: 0, // ✅ 일반 몹 없음
      maxCount: 0,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'manual', // ✅ 'jobChange' → 'manual'로 변경
      spawnPosition: {
        x: 'center',
        y: 'center',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'semi_boss', // ✅ 단일 보스만 설정
      },
    },
    portals: generateMapPortals('dark'),
  },

  snow: {
    key: 'snow',
    name: 'Snow',
    layersOffsetY: 100,
    repeatCount: 2,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'snow_layer3', path: '/assets/map/snow/background1.png' },
      { key: 'snow_layer3', path: '/assets/map/snow/background2.png' },
      { key: 'snow_layer3', path: '/assets/map/snow/background3.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('snow'),
  },

  temple_way: {
    key: 'temple_way',
    name: 'Temple Way',
    mapScale: 1.5,
    layersOffsetY: 150,
    camera: {
      offsetY: -50,
    },
    layers: [{ key: 'temple_way', path: '/assets/map/temple/background1.png' }],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    portals: generateMapPortals('temple_way'),
  },

  // ✅ temple_1: 보스 맵이므로 일반 적 없음
  temple_1: {
    key: 'temple_1',
    name: 'Temple1',
    mapScale: 0.45,
    layersOffsetY: 150,
    camera: {
      offsetY: -50,
    },
    layers: [{ key: 'temple1', path: '/assets/map/temple/background 4/Preview 4.png' }],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
      offsetY: 200,
    },
    gravity: 1000,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      boss: 95,
      ui: 1000,
    },
    // ✅ 적 스폰 비활성화
    enemies: {
      types: [], // 빈 배열 유지
      initialCount: 0, // ✅ 0으로 변경
      maxCount: 0, // ✅ 0으로 변경
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'jobChange',
      spawnPosition: {
        x: 'center',
        y: '700',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'assassin_boss',
        fire_knight: 'fire_boss',
        bladekeeper: 'bladekeeper_boss',
        monk: 'monk_boss',
        princess: 'princess_boss',
        mauler: 'mauler_boss',
      },
    },
    portals: generateMapPortals('temple_1'),
  },

  temple_2: {
    key: 'temple_2',
    name: 'Temple2',
    mapScale: 0.45,
    layersOffsetY: 0,
    camera: {
      offsetY: -50,
    },
    layers: [{ key: 'temple2', path: '/assets/map/temple/background 3/Preview 3.png' }],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      boss: 95,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'jobChange',
      spawnPosition: {
        x: 'center',
        y: 'center',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'assassin_boss',
        fire_knight: 'fire_boss',
        bladekeeper: 'bladekeeper_boss',
        monk: 'monk_boss',
        princess: 'princess_boss',
        mauler: 'mauler_boss',
      },
    },
    portals: generateMapPortals('temple_2'),
  },

  temple_3: {
    key: 'temple_3',
    name: 'Temple3',
    mapScale: 0.45,
    layersOffsetY: 0,
    camera: {
      offsetY: -50,
    },
    layers: [{ key: 'temple3', path: '/assets/map/temple/background 2/Preview 2.png' }],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      boss: 95,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'jobChange',
      spawnPosition: {
        x: 'center',
        y: 'center',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'assassin_boss',
        fire_knight: 'fire_boss',
        bladekeeper: 'bladekeeper_boss',
        monk: 'monk_boss',
        princess: 'princess_boss',
        mauler: 'mauler_boss',
      },
    },
    portals: generateMapPortals('temple_3'),
  },

  temple_4: {
    key: 'temple_4',
    name: 'Temple4',
    mapScale: 0.45,
    layersOffsetY: 0,
    camera: {
      offsetY: -50,
    },
    layers: [{ key: 'temple4', path: '/assets/map/temple/background 1/Preview 1.png' }],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
      offsetY: 200,
    },
    gravity: 800,
    playerScale: 2,
    depths: {
      backgroundStart: 0,
      tilemapStart: 50,
      player: 100,
      enemy: 90,
      boss: 95,
      ui: 1000,
    },
    enemies: {
      types: ['Slime', 'Bat', 'Monkey', 'Canine'],
      initialCount: 20,
      maxCount: 35,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'jobChange',
      spawnPosition: {
        x: 'center',
        y: 'center',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'assassin_boss',
        fire_knight: 'fire_boss',
        bladekeeper: 'bladekeeper_boss',
        monk: 'monk_boss',
        princess: 'princess_boss',
        mauler: 'mauler_boss',
      },
    },
    portals: generateMapPortals('temple_4'),
  },

  final_map: {
    key: 'final_map',
    name: 'Final Map',
    mapScale: 5.2,
    layersOffsetY: 250,
    camera: {
      offsetY: -50,
    },
    layers: [
      { key: 'final_map_layer1', path: '/assets/map/final_map/background1.png' },
      { key: 'final_map_layer2', path: '/assets/map/final_map/background2.png' },
      { key: 'final_map_layer3', path: '/assets/map/final_map/background3.png' },
    ],
    underSolidRectangle: {
      y: 200,
      color: '#000000',
    },
    spawn: {
      x: 'left',
      y: 'bottom',
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
      types: [],
      initialCount: 0, // ✅ 일반 몹 없음
      maxCount: 0,
      respawnInterval: 5000,
      patrolRangeX: 100,
      minPlayerDistance: 100,
    },
    boss: {
      enabled: true,
      spawnCondition: 'manual', // ✅ 'jobChange' → 'manual'로 변경
      spawnPosition: {
        x: 'center',
        y: 'center',
        offsetX: 0,
        offsetY: -100,
      },
      jobBossMapping: {
        assassin: 'final_boss', // ✅ 단일 보스만 설정
      },
    },
    portals: generateMapPortals('final_map'),
  },
};
