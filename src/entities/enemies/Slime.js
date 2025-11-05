import EnemyBase from './EnemyBase.js';

export default class Slime extends EnemyBase {
  constructor(scene, x, y, scale = 1, patrolRangeX = 0) {
    super(scene, x, y, 'slime', scale, patrolRangeX);
    this.speed = 40 + Math.random() * 40;
  }
}
