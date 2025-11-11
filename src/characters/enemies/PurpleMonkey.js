import EnemyBase from './EnemyBase';

export default class PurpleMonkey extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'purple_monkey', -1);

    if (scene.mapConfig?.depths?.enemy) {
      this.hpBar.setDepth(scene.mapConfig.depths.enemy + 1);
    }
  }

  static preload(scene) {
    EnemyBase.preload(scene, 'purple_monkey');
  }
}
