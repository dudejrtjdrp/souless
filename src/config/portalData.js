export const PORTAL_CONNECTIONS = {
  // ===== Other Cave 맵 포탈 =====
  other_cave_to_scary_cave: {
    id: 'other_cave_to_scary_cave',
    name: 'Other Cave to Scary Cave',
    sourceMap: 'other_cave',
    sourcePosition: { x: 200, y: 780 },
    targetPortalId: 'scary_cave_from_other_cave',
  },

  // ===== Scary Cave 맵 포탈 =====
  scary_cave_from_other_cave: {
    id: 'scary_cave_from_other_cave',
    name: 'Scary Cave (from Other Cave)',
    sourceMap: 'scary_cave',
    sourcePosition: { x: 200, y: 780 },
    targetPortalId: 'other_cave_to_scary_cave',
  },
  scary_cave_to_cave: {
    id: 'scary_cave_to_cave',
    name: 'Scary Cave to Cave',
    sourceMap: 'scary_cave',
    sourcePosition: { x: 500, y: 780 },
    targetPortalId: 'cave_from_scary_cave',
  },

  // ===== Cave 맵 포탈 =====
  cave_from_scary_cave: {
    id: 'cave_from_scary_cave',
    name: 'Cave (from Scary Cave)',
    sourceMap: 'cave',
    sourcePosition: { x: 200, y: 1100 },
    targetPortalId: 'scary_cave_to_cave',
  },
  cave_to_dark_cave: {
    id: 'cave_to_dark_cave',
    name: 'Cave to Dark Cave',
    sourceMap: 'cave',
    sourcePosition: { x: 500, y: 1100 },
    targetPortalId: 'dark_cave_from_cave',
  },

  // ===== Dark Cave 맵 포탈 =====
  dark_cave_from_cave: {
    id: 'dark_cave_from_cave',
    name: 'Dark Cave (from Cave)',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 200, y: 780 },
    targetPortalId: 'cave_to_dark_cave',
  },
  dark_cave_to_forest: {
    id: 'dark_cave_to_forest',
    name: 'Dark Cave to Forest',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 500, y: 780 },
    targetPortalId: 'forest_from_dark_cave',
  },

  // ===== Forest 맵 포탈 =====
  forest_from_dark_cave: {
    id: 'forest_from_dark_cave',
    name: 'Forest (from Dark Cave)',
    sourceMap: 'forest',
    sourcePosition: { x: 200, y: 2164 },
    targetPortalId: 'dark_cave_to_forest',
  },
  forest_to_oakwood: {
    id: 'forest_to_oakwood',
    name: 'Forest to Oakwood',
    sourceMap: 'forest',
    sourcePosition: { x: 500, y: 2164 },
    targetPortalId: 'oakwood_from_forest',
  },

  // ===== Oakwood 맵 포탈 =====
  oakwood_from_forest: {
    id: 'oakwood_from_forest',
    name: 'Oakwood (from Forest)',
    sourceMap: 'oakwood',
    sourcePosition: { x: 200, y: 1500 },
    targetPortalId: 'forest_to_oakwood',
  },
  oakwood_to_temple_way: {
    id: 'oakwood_to_temple_way',
    name: 'Oakwood to Temple Way',
    sourceMap: 'oakwood',
    sourcePosition: { x: 500, y: 1500 },
    targetPortalId: 'temple_way_from_oakwood',
  },

  // ===== Temple Way 맵 포탈 =====
  temple_way_from_oakwood: {
    id: 'temple_way_from_oakwood',
    name: 'Temple Way (from Oakwood)',
    sourceMap: 'temple_way',
    sourcePosition: { x: 200, y: 1200 },
    targetPortalId: 'oakwood_to_temple_way',
  },
  temple_way_to_temple_1: {
    id: 'temple_way_to_temple_1',
    name: 'Temple Way to Temple 1',
    sourceMap: 'temple_way',
    sourcePosition: { x: 500, y: 1200 },
    targetPortalId: 'temple_1_from_temple_way',
  },

  // ===== Temple 1 맵 포탈 =====
  temple_1_from_temple_way: {
    id: 'temple_1_from_temple_way',
    name: 'Temple 1 (from Temple Way)',
    sourceMap: 'temple_1',
    sourcePosition: { x: 200, y: 900 },
    targetPortalId: 'temple_way_to_temple_1',
  },
  temple_1_to_temple_2: {
    id: 'temple_1_to_temple_2',
    name: 'Temple 1 to Temple 2',
    sourceMap: 'temple_1',
    sourcePosition: { x: 500, y: 900 },
    targetPortalId: 'temple_2_from_temple_1',
  },

  // ===== Temple 2 맵 포탈 =====
  temple_2_from_temple_1: {
    id: 'temple_2_from_temple_1',
    name: 'Temple 2 (from Temple 1)',
    sourceMap: 'temple_2',
    sourcePosition: { x: 200, y: 900 },
    targetPortalId: 'temple_1_to_temple_2',
  },
  temple_2_to_temple_3: {
    id: 'temple_2_to_temple_3',
    name: 'Temple 2 to Temple 3',
    sourceMap: 'temple_2',
    sourcePosition: { x: 500, y: 900 },
    targetPortalId: 'temple_3_from_temple_2',
  },

  // ===== Temple 3 맵 포탈 =====
  temple_3_from_temple_2: {
    id: 'temple_3_from_temple_2',
    name: 'Temple 3 (from Temple 2)',
    sourceMap: 'temple_3',
    sourcePosition: { x: 200, y: 900 },
    targetPortalId: 'temple_2_to_temple_3',
  },
  temple_3_to_temple_4: {
    id: 'temple_3_to_temple_4',
    name: 'Temple 3 to Temple 4',
    sourceMap: 'temple_3',
    sourcePosition: { x: 500, y: 900 },
    targetPortalId: 'temple_4_from_temple_3',
  },

  // ===== Temple 4 맵 포탈 =====
  temple_4_from_temple_3: {
    id: 'temple_4_from_temple_3',
    name: 'Temple 4 (from Temple 3)',
    sourceMap: 'temple_4',
    sourcePosition: { x: 200, y: 900 },
    targetPortalId: 'temple_3_to_temple_4',
  },
  temple_4_to_snow: {
    id: 'temple_4_to_snow',
    name: 'Temple 4 to Snow',
    sourceMap: 'temple_4',
    sourcePosition: { x: 500, y: 900 },
    targetPortalId: 'snow_from_temple_4',
  },

  // ===== Snow 맵 포탈 =====
  snow_from_temple_4: {
    id: 'snow_from_temple_4',
    name: 'Snow (from Temple 4)',
    sourceMap: 'snow',
    sourcePosition: { x: 200, y: 1100 },
    targetPortalId: 'temple_4_to_snow',
  },
  snow_to_dark: {
    id: 'snow_to_dark',
    name: 'Snow to Dark',
    sourceMap: 'snow',
    sourcePosition: { x: 500, y: 1100 },
    targetPortalId: 'dark_from_snow',
  },

  // ===== Dark 맵 포탈 =====
  dark_from_snow: {
    id: 'dark_from_snow',
    name: 'Dark (from Snow)',
    sourceMap: 'dark',
    sourcePosition: { x: 200, y: 800 },
    targetPortalId: 'snow_to_dark',
  },
  dark_to_final_map: {
    id: 'dark_to_final_map',
    name: 'Dark to Final Map',
    sourceMap: 'dark',
    sourcePosition: { x: 500, y: 800 },
    targetPortalId: 'final_map_from_dark',
  },

  // ===== Final Map 맵 포탈 =====
  final_map_from_dark: {
    id: 'final_map_from_dark',
    name: 'Final Map (from Dark)',
    sourceMap: 'final_map',
    sourcePosition: { x: 200, y: 1000 },
    targetPortalId: 'dark_to_final_map',
  },
};
