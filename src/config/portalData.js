export const PORTAL_CONNECTIONS = {
  // ===== Forest 맵 포탈 =====
  forest_to_cave: {
    id: 'forest_to_cave',
    name: 'Forest Cave Entrance',
    sourceMap: 'forest',
    sourcePosition: { x: 200, y: 2164 },
    targetPortalId: 'cave_from_forest', // Cave 맵의 도착 포탈
  },

  forest_to_village: {
    id: 'forest_to_village',
    name: 'Forest Village Gate',
    sourceMap: 'forest',
    sourcePosition: { x: 2500, y: 2164 },
    targetPortalId: 'village_from_forest', // Village 맵의 도착 포탈
  },

  // ===== Cave 맵 포탈 =====
  cave_to_forest: {
    id: 'cave_to_forest',
    name: 'Cave Forest Exit',
    sourceMap: 'cave',
    sourcePosition: { x: 800, y: 400 },
    targetPortalId: 'forest_from_cave', // Forest 맵의 도착 포탈
  },

  cave_to_village: {
    id: 'cave_to_village',
    name: 'Cave Village Tunnel',
    sourceMap: 'cave',
    sourcePosition: { x: 1600, y: 300 },
    targetPortalId: 'village_from_cave', // Village 맵의 도착 포탈
  },

  // ===== Dark Cave 맵 포탈 =====
  dark_cave_to_forest: {
    id: 'dark_cave_to_forest',
    name: 'Dark Cave Forest Path',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 800, y: 895 },
    targetPortalId: 'forest_from_dark_cave', // Forest 맵의 도착 포탈
  },

  dark_cave_to_village: {
    id: 'dark_cave_to_village',
    name: 'Dark Cave Village Path',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 1600, y: 895 },
    targetPortalId: 'village_from_dark_cave', // Village 맵의 도착 포탈
  },

  // ===== 목적지 포탈 (되돌아오는 지점) =====
  // 이 포탈들은 실제로 맵에 배치되어야 합니다!

  forest_from_cave: {
    id: 'forest_from_cave',
    name: 'Forest (from Cave)',
    sourceMap: 'forest',
    sourcePosition: { x: 200, y: 2164 }, // cave_to_forest와 같은 위치에 배치
    targetPortalId: 'cave_to_forest', // 돌아갈 때는 Cave의 포탈로
  },

  forest_from_dark_cave: {
    id: 'forest_from_dark_cave',
    name: 'Forest (from Dark Cave)',
    sourceMap: 'forest',
    sourcePosition: { x: 2500, y: 2164 }, // 다른 위치
    targetPortalId: 'dark_cave_to_forest', // 돌아갈 때는 Dark Cave의 포탈로
  },

  cave_from_forest: {
    id: 'cave_from_forest',
    name: 'Cave (from Forest)',
    sourceMap: 'cave',
    sourcePosition: { x: 800, y: 400 }, // forest_to_cave로 도착하는 지점
    targetPortalId: 'forest_to_cave', // 돌아갈 때는 Forest의 포탈로
  },

  cave_from_village: {
    id: 'cave_from_village',
    name: 'Cave (from Village)',
    sourceMap: 'cave',
    sourcePosition: { x: 1600, y: 300 }, // 다른 위치
    targetPortalId: 'village_to_cave', // Village에서 오는 포탈 (없으면 추가 필요)
  },

  dark_cave_from_forest: {
    id: 'dark_cave_from_forest',
    name: 'Dark Cave (from Forest)',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 800, y: 895 },
    targetPortalId: 'forest_to_dark_cave', // 돌아갈 때는 Forest의 포탈로
  },

  village_from_forest: {
    id: 'village_from_forest',
    name: 'Village (from Forest)',
    sourceMap: 'village_map',
    sourcePosition: { x: 100, y: 500 },
    targetPortalId: 'forest_to_village', // 돌아갈 때는 Forest의 포탈로
  },

  village_from_cave: {
    id: 'village_from_cave',
    name: 'Village (from Cave)',
    sourceMap: 'village_map',
    sourcePosition: { x: 200, y: 500 },
    targetPortalId: 'cave_to_village', // 돌아갈 때는 Cave의 포탈로
  },

  village_from_dark_cave: {
    id: 'village_from_dark_cave',
    name: 'Village (from Dark Cave)',
    sourceMap: 'village_map',
    sourcePosition: { x: 300, y: 500 },
    targetPortalId: 'dark_cave_to_village', // 돌아갈 때는 Dark Cave의 포탈로
  },
};

/**
 * 포탈 매니저 - 포탈 연결 관리 및 조회
 */
export class PortalManager {
  /**
   * 포탈 ID로 포탈 데이터 가져오기
   */
  static getPortal(portalId) {
    return PORTAL_CONNECTIONS[portalId] || null;
  }

  /**
   * 맵에 있는 모든 포탈 가져오기
   */
  static getPortalsByMap(mapKey) {
    return Object.values(PORTAL_CONNECTIONS).filter((portal) => portal.sourceMap === mapKey);
  }

  /**
   * 목적지 포탈 정보 가져오기
   */
  static getDestinationPortal(portalId) {
    const portal = this.getPortal(portalId);
    if (!portal || !portal.targetPortalId) return null;

    const targetPortal = this.getPortal(portal.targetPortalId);
    return targetPortal;
  }

  /**
   * 포탈 연결 정보 가져오기 (출발지 → 목적지)
   */
  static getPortalConnection(sourcePortalId) {
    const sourcePortal = this.getPortal(sourcePortalId);
    if (!sourcePortal) return null;

    const targetPortal = this.getDestinationPortal(sourcePortalId);
    if (!targetPortal) return null;

    return {
      source: sourcePortal,
      target: targetPortal,
      targetMap: targetPortal.sourceMap,
      targetPosition: targetPortal.sourcePosition,
    };
  }

  /**
   * 맵 간 연결된 포탈 찾기
   */
  static findPortalBetweenMaps(fromMap, toMap) {
    return Object.values(PORTAL_CONNECTIONS).find((portal) => {
      if (portal.sourceMap !== fromMap) return false;
      const target = this.getDestinationPortal(portal.id);
      return target && target.sourceMap === toMap;
    });
  }

  /**
   * 디버그: 포탈 연결 출력
   */
  static debugPrintConnections() {
    console.log('=== Portal Connections ===');
    Object.values(PORTAL_CONNECTIONS).forEach((portal) => {
      const target = this.getDestinationPortal(portal.id);
      console.log(`${portal.id}:`);
      console.log(
        `  From: ${portal.sourceMap} (${portal.sourcePosition.x}, ${portal.sourcePosition.y})`,
      );
      if (target) {
        console.log(
          `  To: ${target.sourceMap} (${target.sourcePosition.x}, ${target.sourcePosition.y})`,
        );
      }
    });
    console.log('========================');
  }
}

/**
 * mapData.js용 포탈 배열 생성 헬퍼
 */
export function generateMapPortals(mapKey) {
  const portals = PortalManager.getPortalsByMap(mapKey);

  return portals.map((portal) => ({
    id: portal.id,
    x: portal.sourcePosition.x,
    y: portal.sourcePosition.y,
    width: 64,
    height: 64,
    targetPortalId: portal.targetPortalId,
  }));
}
