// controllers/EnemyManager.js
import Phaser from 'phaser';
import Canine from '../characters/enemies/Canine.js';
import Slime from '../characters/enemies/Slime.js';
import Bat from '../characters/enemies/Bat.js';
import PurpleMonkey from '../characters/enemies/PurpleMonkey.js';

const enemyClassMap = { Slime, Canine, Bat, PurpleMonkey };

export default class EnemyManager {
  constructor(scene, mapConfig, mapModel, player) {
    this.scene = scene;
    this.mapConfig = mapConfig;
    this.mapModel = mapModel;
    this.player = player;
    this.enemies = [];
    this.lastSpawnTime = 0;

    const worldBounds = scene.physics.world.bounds;
    this.spawnMinX = 50;
    this.spawnMaxX = worldBounds.width - 50;

    if (mapModel.config.autoScale) {
      const groundY = mapModel.getGroundY ? mapModel.getGroundY() : worldBounds.height - 200;
      this.spawnY = groundY - 100;
    } else {
      this.spawnY = mapConfig.enemies.yFixed;
    }
  }

  createInitial() {
    const { types, initialCount, patrolRangeX } = this.mapConfig.enemies;
    for (let i = 0; i < initialCount; i++) {
      this.spawnRandomEnemy(types, patrolRangeX);
    }
  }

  update(time, delta) {
    const { types, maxCount, respawnInterval, patrolRangeX, minPlayerDistance } =
      this.mapConfig.enemies;

    // ✅ 적 업데이트 (패트롤만)
    this.enemies.forEach((enemy) => {
      if (enemy && enemy.sprite && !enemy.isDead) {
        this.updatePatrol(enemy);
        if (enemy.update) {
          enemy.update(time, delta);
        }
      }
    });

    // ❌ 공격 체크 제거 - GameScene에서 처리함
    // 이 부분 전체 삭제!

    // ✅ 제거된 적 필터링
    this.enemies = this.enemies.filter((e) => e && !e.isDead);

    // ✅ 리젠
    if (this.enemies.length < maxCount && time - this.lastSaveTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  // ❌ handleEnemyDeath 메서드 삭제 - 필요 없음!
  // GameScene에서 처리하므로 여기서는 안 씀

  updatePatrol(enemy) {
    if (!enemy || !enemy.sprite || !enemy.sprite.body) return;

    const leftBound = enemy.startX - enemy.patrolRangeX;
    const rightBound = enemy.startX + enemy.patrolRangeX;

    if (enemy.sprite.x <= leftBound) {
      enemy.direction = 1;
      enemy.sprite.setFlipX(false);
      enemy.sprite.x = leftBound;
    } else if (enemy.sprite.x >= rightBound) {
      enemy.direction = -1;
      enemy.sprite.setFlipX(true);
      enemy.sprite.x = rightBound;
    }

    enemy.sprite.body.setVelocityX(enemy.direction * enemy.speed);
  }

  spawnRandomEnemy(types, patrolRangeX) {
    const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
    this.createEnemy(types, x, patrolRangeX);
  }

  spawnRandomEnemyNearPlayer(types, patrolRangeX, minDistance = 200) {
    let x;
    const playerX = this.player.sprite.x;
    const attempts = 10;
    for (let i = 0; i < attempts; i++) {
      x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
      if (Math.abs(x - playerX) >= minDistance) break;
    }
    this.createEnemy(types, x, patrolRangeX);
  }

  createEnemy(types, x, patrolRangeX) {
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    const EnemyClass = enemyClassMap[type];
    if (!EnemyClass) {
      console.warn(`Enemy class not found: ${type}`);
      return;
    }

    const enemy = new EnemyClass(this.scene, x, this.spawnY);

    if (!enemy || !enemy.sprite) {
      console.error('Enemy creation failed');
      return;
    }

    enemy.startX = x;
    enemy.patrolRangeX = patrolRangeX;
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

    if (this.mapConfig.depths?.enemy !== undefined) {
      enemy.sprite.setDepth(this.mapConfig.depths.enemy);
    }

    this.enemies.push(enemy);

    if (this.mapModel && this.mapModel.addEnemy) {
      this.mapModel.addEnemy(enemy.sprite);
    } else {
      console.warn('MapModel not available or addEnemy method missing');
    }
  }

  destroy() {
    this.enemies.forEach((enemy) => {
      if (enemy && enemy.sprite) {
        enemy.sprite.destroy();
      }
    });
    this.enemies = [];
  }
}
