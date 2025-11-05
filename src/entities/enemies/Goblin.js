import Phaser from 'phaser';
import EnemyBase from './EnemyBase.js';

export default class Goblin extends EnemyBase {
  constructor(scene, x, y, scale = 1, patrolRangeX = 100) {
    super(scene, x, y, 32 * scale, 32 * scale, patrolRangeX, 3); // 체력 3
  }
}
