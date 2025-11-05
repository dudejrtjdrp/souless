import Slime from '../entities/enemies/Slime.js';
import Goblin from '../entities/enemies/Goblin.js';
import Bat from '../entities/enemies/Bat.js';

const enemyClassMap = { Slime, Goblin, Bat };

export default class EnemyManager {
  constructor(scene, mapConfig, collisionLayer, player) {
    this.scene = scene;
    this.mapConfig = mapConfig;
    this.collisionLayer = collisionLayer;
    this.player = player; // 플레이어 참조
    this.enemies = [];
    this.lastSpawnTime = 0;

    // 맵 X 범위 자동 계산
    const worldBounds = scene.physics.world.bounds;
    this.spawnMinX = 50;
    this.spawnMaxX = worldBounds.width - 50;
  }

  createInitial() {
    const { types, initialCount, yFixed, patrolRangeX } = this.mapConfig.enemies;
    for (let i = 0; i < initialCount; i++) {
      this.spawnRandomEnemy(types, yFixed, patrolRangeX);
    }
  }

  update(time, delta) {
    const { types, maxCount, respawnInterval, yFixed, patrolRangeX, minPlayerDistance } =
      this.mapConfig.enemies;

    // 적 업데이트
    this.enemies.forEach((enemy) => enemy.update(time, delta));

    // 리젠
    if (this.enemies.length < maxCount && time - this.lastSpawnTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, yFixed, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  spawnRandomEnemy(types, yFixed, patrolRangeX) {
    const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
    this.createEnemy(types, x, yFixed, patrolRangeX);
  }

  spawnRandomEnemyNearPlayer(types, yFixed, patrolRangeX, minDistance = 200) {
    let x;
    const playerX = this.player.sprite.x;
    const attempts = 10; // 무한루프 방지
    for (let i = 0; i < attempts; i++) {
      x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
      if (Math.abs(x - playerX) >= minDistance) break;
    }
    this.createEnemy(types, x, yFixed, patrolRangeX);
  }

  createEnemy(types, x, y, patrolRangeX) {
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    const EnemyClass = enemyClassMap[type];
    if (!EnemyClass) return;

    const enemy = new EnemyClass(this.scene, x, y, 1, patrolRangeX);
    this.enemies.push(enemy);

    if (this.collisionLayer) {
      this.scene.physics.add.collider(enemy.sprite, this.collisionLayer);
    }
  }
}
