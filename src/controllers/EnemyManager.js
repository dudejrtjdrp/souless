import Phaser from 'phaser';
import Slime from '../entities/enemies/Slime.js';
import Goblin from '../entities/enemies/Canine.js';
import Bat from '../entities/enemies/Bat.js';

const enemyClassMap = { Slime, Goblin, Bat };

export default class EnemyManager {
  constructor(scene, mapConfig, collisionLayer, player) {
    this.scene = scene;
    this.mapConfig = mapConfig;
    this.collisionLayer = collisionLayer;
    this.player = player;
    this.enemies = [];
    this.lastSpawnTime = 0;

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
    this.enemies.forEach((enemy) => {
      this.updatePatrol(enemy, delta);
      enemy.update(time, delta);
    });

    // 공격 hitbox와 충돌 판정

    if (this.player.attackHitbox.body.enable) {
      for (const enemy of this.enemies) {
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.player.attackHitbox.getBounds(),
            enemy.sprite.getBounds(),
          )
        ) {
          enemy.takeDamage(this.mapConfig.enemies.attackDamage || 1);
          break; // 첫 번째 적만 처리
        }
      }
    }

    // 제거된 적 필터링
    this.enemies = this.enemies.filter((e) => !e.isDead);

    // 리젠
    if (this.enemies.length < maxCount && time - this.lastSpawnTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, yFixed, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  updatePatrol(enemy, delta) {
    const speed = enemy.speed || 50;
    enemy.sprite.body.velocity.x = enemy.direction * speed;

    // 좌우 범위 체크
    if (enemy.sprite.x < enemy.startX - enemy.patrolRangeX) {
      enemy.sprite.x = enemy.startX - enemy.patrolRangeX;
      enemy.direction = 1;
    } else if (enemy.sprite.x > enemy.startX + enemy.patrolRangeX) {
      enemy.sprite.x = enemy.startX + enemy.patrolRangeX;
      enemy.direction = -1;
    }
  }

  spawnRandomEnemy(types, yFixed, patrolRangeX) {
    const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
    this.createEnemy(types, x, yFixed, patrolRangeX);
  }

  spawnRandomEnemyNearPlayer(types, yFixed, patrolRangeX, minDistance = 200) {
    let x;
    const playerX = this.player.sprite.x;
    const attempts = 10;
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

    enemy.hp = 3;
    enemy.isDead = false;

    // Patrol 초기값
    enemy.startX = x;
    enemy.patrolRangeX = patrolRangeX;
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    enemy.speed = 50;

    // ✅ enemy depth 적용
    if (this.mapConfig.depths?.enemy !== undefined) {
      enemy.sprite.setDepth(this.mapConfig.depths.enemy);
    }

    this.enemies.push(enemy);

    if (this.collisionLayer) {
      this.scene.physics.add.collider(enemy.sprite, this.collisionLayer);
    }
  }
}
