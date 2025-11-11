import { PortalManager } from '../../controllers/PortalManager';

export default class PlayerSpawnManager {
  constructor(scene) {
    this.scene = scene;
  }

  determineSpawnPosition(defaultSpawn, portals) {
    const rawPosition = this.getRawSpawnPosition(defaultSpawn);
    return this.adjustSpawnForAutoScale(rawPosition);
  }

  getRawSpawnPosition(defaultSpawn) {
    if (!this.scene.savedSpawnData) {
      return this.getFirstPortalPosition() || defaultSpawn;
    }

    if (this.scene.savedSpawnData.fromPortal) {
      return this.getPortalSpawnPosition() || defaultSpawn;
    }

    if (this.hasSavedCoordinates()) {
      return this.getSavedCoordinates();
    }

    return defaultSpawn;
  }

  getFirstPortalPosition() {
    const portals = PortalManager.getPortalsByMap(this.scene.currentMapKey);
    const firstPortal = portals[0];

    return firstPortal
      ? {
          x: firstPortal.sourcePosition.x,
          y: firstPortal.sourcePosition.y,
        }
      : null;
  }

  getPortalSpawnPosition() {
    const { portalId } = this.scene.savedSpawnData;
    const targetPortal = PortalManager.getPortal(portalId);

    if (targetPortal?.sourceMap === this.scene.currentMapKey) {
      return {
        x: targetPortal.sourcePosition.x,
        y: targetPortal.sourcePosition.y,
      };
    }

    return null;
  }

  hasSavedCoordinates() {
    const data = this.scene.savedSpawnData;
    return data.x !== undefined && data.y !== undefined;
  }

  getSavedCoordinates() {
    return {
      x: this.scene.savedSpawnData.x,
      y: this.scene.savedSpawnData.y,
    };
  }

  adjustSpawnForAutoScale(position) {
    if (!this.scene.mapModel.config.autoScale || !position) {
      return position;
    }

    const groundY = this.scene.mapModel.getGroundY();

    if (position.y >= groundY - 100) {
      position.y = groundY - 150;
    }

    return position;
  }
}
