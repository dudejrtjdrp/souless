import EnemyBase from '../base/EnemyBase';

export default class Monkey extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'monkey', -1);

    if (scene.mapConfig?.depths?.enemy) {
      this.hpBar.setDepth(scene.mapConfig.depths.enemy + 1);
    }
  }

  static preload(scene) {
    EnemyBase.preload(scene, 'monkey');
  }
}
