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
    this.mapModel = mapModel; // MapModel 사용
    this.player = player;
    this.enemies = [];
    this.lastSpawnTime = 0;

    const worldBounds = scene.physics.world.bounds;
    this.spawnMinX = 50;
    this.spawnMaxX = worldBounds.width - 50;
    this.spawnY = mapConfig.enemies.yFixed; // 위쪽에 생성 후 낙하
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

    // 적 업데이트
    this.enemies.forEach((enemy) => {
      this.updatePatrol(enemy);
      enemy.update(time, delta);
    });

    // 공격 hitbox와 충돌 판정
    if (this.player.isAttacking()) {
      const sortedEnemies = [...this.enemies].sort((a, b) => {
        const distA = Phaser.Math.Distance.Between(
          this.player.sprite.x,
          this.player.sprite.y,
          a.sprite.x,
          a.sprite.y,
        );
        const distB = Phaser.Math.Distance.Between(
          this.player.sprite.x,
          this.player.sprite.y,
          b.sprite.x,
          b.sprite.y,
        );
        return distA - distB;
      });

      for (const enemy of sortedEnemies) {
        if (this.player.checkAttackHit(enemy)) {
          enemy.takeDamage(this.mapConfig.enemies.attackDamage || 1);
          break;
        }
      }
    }

    // 제거된 적 필터링
    this.enemies = this.enemies.filter((e) => !e.isDead);

    // 리젠
    if (this.enemies.length < maxCount && time - this.lastSpawnTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  updatePatrol(enemy) {
    const leftBound = enemy.startX - enemy.patrolRangeX;
    const rightBound = enemy.startX + enemy.patrolRangeX;

    // 좌우 범위 체크
    if (enemy.sprite.x <= leftBound) {
      enemy.direction = 1;
      enemy.sprite.setFlipX(false);
      enemy.sprite.x = leftBound; // 위치 보정 최소화
    } else if (enemy.sprite.x >= rightBound) {
      enemy.direction = -1;
      enemy.sprite.setFlipX(true);
      enemy.sprite.x = rightBound; // 위치 보정 최소화
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
    if (!EnemyClass) return;

    // ✅ 위쪽에 생성
    const enemy = new EnemyClass(this.scene, x, this.spawnY);

    // Patrol 초기값
    enemy.startX = x;
    enemy.patrolRangeX = patrolRangeX;
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

    // Depth 적용
    if (this.mapConfig.depths?.enemy !== undefined) {
      enemy.sprite.setDepth(this.mapConfig.depths.enemy);
    }

    this.enemies.push(enemy);

    // ✅ MapModel을 통해 collision 추가
    if (this.mapModel) {
      this.mapModel.addEnemy(enemy.sprite);
    } else {
      console.error('MapModel not available!');
    }
  }

  destroy() {
    this.enemies.forEach((enemy) => {
      if (enemy.sprite) {
        enemy.sprite.destroy();
      }
    });
    this.enemies = [];
  }
}
