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
    sourcePosition: { x: 200, y: 895 },
    targetPortalId: 'forest_to_dark_cave',
  },
  dark_cave_from_cave: {
    id: 'dark_cave_from_cave',
    name: 'Dark Cave (from Cave)',
    sourceMap: 'dark_cave',
    sourcePosition: { x: 500, y: 895 },
    targetPortalId: 'cave_to_dark_cave',
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
