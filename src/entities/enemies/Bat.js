import EnemyBase from './EnemyBase.js';

export default class Bat extends EnemyBase {
  constructor(scene, x, y, scale = 1, patrolRangeX = 0) {
    super(scene, x, y, 'bat', scale, patrolRangeX);
    this.speed = 40 + Math.random() * 40;
  }
}
