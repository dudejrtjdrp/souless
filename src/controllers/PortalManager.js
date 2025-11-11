import { PORTAL_CONNECTIONS } from '../config/portalData';

export class PortalManager {
  static getPortal(portalId) {
    return PORTAL_CONNECTIONS[portalId] || null;
  }

  static getPortalsByMap(mapKey) {
    return Object.values(PORTAL_CONNECTIONS).filter((portal) => portal.sourceMap === mapKey);
  }

  static getDestinationPortal(portalId) {
    const portal = this.getPortal(portalId);
    if (!portal || !portal.targetPortalId) return null;

    const targetPortal = this.getPortal(portal.targetPortalId);
    return targetPortal;
  }

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

  static findPortalBetweenMaps(fromMap, toMap) {
    return Object.values(PORTAL_CONNECTIONS).find((portal) => {
      if (portal.sourceMap !== fromMap) return false;
      const target = this.getDestinationPortal(portal.id);
      return target && target.sourceMap === toMap;
    });
  }

  static debugPrintConnections() {
    Object.values(PORTAL_CONNECTIONS).forEach((portal) => {
      const target = this.getDestinationPortal(portal.id);
    });
  }
}
