import { PortalManager } from '../controllers/PortalManager';

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
