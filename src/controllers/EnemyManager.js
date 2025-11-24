import Phaser from 'phaser';
import Canine from '../entities/enemies/useable/Canine.js';
import Slime from '../entities/enemies/useable/Slime.js';
import Bat from '../entities/enemies/useable/Bat.js';
import Monkey from '../entities/enemies/useable/PurpleMonkey.js';

const enemyClassMap = { Slime, Canine, Bat, Monkey };

export default class EnemyManager {
  constructor(scene, mapConfig, mapModel, player) {
    this.scene = scene;
    this.mapConfig = mapConfig;
    this.mapModel = mapModel;
    this.player = player;
    this.enemies = [];
    this.lastSpawnTime = 0;
    this.isSpawningPaused = false;

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

  pauseSpawning() {
    this.isSpawningPaused = true;
  }

  resumeSpawning() {
    this.isSpawningPaused = false;
  }

  createInitial() {
    const { types, initialCount, patrolRangeX } = this.mapConfig.enemies;

    // types 배열 검증
    if (!types || !Array.isArray(types) || types.length === 0) {
      console.warn('⚠️ No enemy types defined in map config');
      return;
    }

    for (let i = 0; i < initialCount; i++) {
      this.spawnRandomEnemy(types, patrolRangeX);
    }
  }

  update(time, delta) {
    const { types, maxCount, respawnInterval, patrolRangeX, minPlayerDistance } =
      this.mapConfig.enemies;

    // 적 업데이트
    this.enemies.forEach((enemy) => {
      if (enemy && enemy.sprite && !enemy.isDead) {
        if (enemy.update) {
          enemy.update(time, delta);
        }
      }
    });

    // 죽은 적 제거
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.isDead) {
        return false;
      }
      return true;
    });

    // 스폰 체크
    if (this.isSpawningPaused) return;

    // types 배열 검증 추가
    if (!types || !Array.isArray(types) || types.length === 0) {
      return;
    }

    if (this.enemies.length < maxCount && time - this.lastSpawnTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  handleEnemyDeath(enemy) {
    if (!enemy || !enemy.expReward) return;

    if (this.scene.onExpGained) {
      const currentCharacterType = this.scene.selectedCharacter || 'soul';
      this.scene.onExpGained(enemy.expReward, currentCharacterType);
    }
  }

  spawnRandomEnemy(types, patrolRangeX) {
    // 유효성 검사
    if (!types || types.length === 0) {
      console.warn('⚠️ Cannot spawn: no enemy types available');
      return;
    }

    const x = Phaser.Math.Between(this.spawnMinX, this.spawnMaxX);
    this.createEnemy(types, x, patrolRangeX);
  }

  spawnRandomEnemyNearPlayer(types, patrolRangeX, minDistance = 200) {
    // 유효성 검사
    if (!types || types.length === 0) {
      console.warn('⚠️ Cannot spawn: no enemy types available');
      return;
    }

    if (!this.player || !this.player.sprite) {
      console.warn('⚠️ Player not available for spawn calculation');
      return;
    }

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
    // types 배열 검증 및 undefined 필터링
    if (!types || !Array.isArray(types) || types.length === 0) {
      console.warn('⚠️ Cannot create enemy: invalid types array');
      return;
    }

    // undefined나 null 제거
    const validTypes = types.filter((t) => t !== undefined && t !== null && t !== '');

    if (validTypes.length === 0) {
      console.warn('⚠️ Cannot create enemy: no valid types after filtering');
      return;
    }

    // 랜덤 타입 선택
    const type = validTypes[Phaser.Math.Between(0, validTypes.length - 1)];

    // 추가 검증
    if (!type) {
      console.warn('⚠️ Selected enemy type is invalid:', type);
      return;
    }

    const EnemyClass = enemyClassMap[type];

    if (!EnemyClass) {
      console.warn(`Enemy class not found: ${type}`);
      console.warn('Available classes:', Object.keys(enemyClassMap));
      console.warn('Provided types:', types);
      return;
    }

    try {
      // 적 생성
      const enemy = new EnemyClass(this.scene, x, this.spawnY, {
        patrolRangeX: patrolRangeX,
        detectRange: this.mapConfig.enemies.detectRange || 200,
        attackRange: this.mapConfig.enemies.attackRange || 70,
        attackDamage: this.mapConfig.enemies.attackDamage || 10,
        attackCooldown: this.mapConfig.enemies.attackCooldown || 1500,
      });

      if (!enemy || !enemy.sprite) {
        console.error('Enemy creation failed: sprite not created');
        return;
      }

      enemy.startX = x;
      enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

      if (this.mapConfig.depths?.enemy !== undefined) {
        enemy.sprite.setDepth(this.mapConfig.depths.enemy);
      }

      this.enemies.push(enemy);

      if (this.mapModel && this.mapModel.addEnemy) {
        this.mapModel.addEnemy(enemy.sprite);
      } else {
        console.warn('⚠️ MapModel not available or addEnemy method missing');
      }
    } catch (error) {
      console.error('Error creating enemy:', error);
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
