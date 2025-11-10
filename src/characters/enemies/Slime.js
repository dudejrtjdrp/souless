import EnemyBase from './EnemyBase.js';

export default class Slime extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime');

    // HP바 depth 설정
    if (scene.mapConfig?.depths?.enemy) {
      this.hpBar.setDepth(scene.mapConfig.depths.enemy + 1);
    }
  }

  static preload(scene) {
    EnemyBase.preload(scene, 'slime');
  }
}
