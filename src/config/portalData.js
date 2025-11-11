// src/data/PortalConnections.js

export const PORTAL_CONNECTIONS = {
  // ===== Forest 맵 포탈 =====
  forest_to_cave: {
    id: 'forest_to_cave',
    name: 'Forest Cave Entrance',
    sourceMap: 'forest',
    sourcePosition: { x: 200, y: 2164 },
    targetPortalId: 'cave_from_forest',
  },
  forest_to_dark_cave: {
    id: 'forest_to_dark_cave',
    name: 'Forest Dark Path',
    sourceMap: 'forest',
    sourcePosition: { x: 500, y: 2164 },
    targetPortalId: 'dark_cave_from_forest',
  },

  // ===== Cave 맵 포탈 =====
  cave_from_forest: {
    id: 'cave_from_forest',
    name: 'Cave (from Forest)',
    sourceMap: 'cave',
    sourcePosition: { x: 500, y: 1100 },
    targetPortalId: 'forest_to_cave',
  },
  cave_to_dark_cave: {
    id: 'cave_to_dark_cave',
    name: 'Cave to Dark Cave',
    sourceMap: 'cave',
    sourcePosition: { x: 200, y: 1100 },
    targetPortalId: 'dark_cave_from_cave',
  },

  // ===== Dark Cave 맵 포탈 =====
  dark_cave_from_forest: {
    id: 'dark_cave_from_forest',
    name: 'Dark Cave (from Forest)',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 200, y: 780 },
    targetPortalId: 'forest_to_dark_cave',
  },
  dark_cave_from_cave: {
    id: 'dark_cave_from_cave',
    name: 'Dark Cave (from Cave)',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 2100, y: 780 },
    targetPortalId: 'cave_to_dark_cave',
  },
};
