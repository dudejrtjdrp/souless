import EnemyBase from './EnemyBase.js';

export default class Goblin extends EnemyBase {
  constructor(scene, x, y, scale = 1, patrolRangeX = 0) {
    super(scene, x, y, 'goblin', scale, patrolRangeX);
    this.speed = 40 + Math.random() * 40;
  }
}
