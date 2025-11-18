// controllers/EnemyManager.js
import Phaser from 'phaser';
import Canine from '../entities/enemies/useable/Canine.js';
import Slime from '../entities/enemies/useable/Slime.js';
import Bat from '../entities/enemies/useable/Bat.js';
import PurpleMonkey from '../entities/enemies/useable/PurpleMonkey.js';

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

    // 적 업데이트 (AI 포함)
    this.enemies.forEach((enemy) => {
      if (enemy && enemy.sprite && !enemy.isDead) {
        // EnemyBase의 update가 AI 로직을 처리함
        if (enemy.update) {
          enemy.update(time, delta);
        }
      }
    });

    // 죽은 적 제거 및 경험치 지급
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.isDead) {
        this.handleEnemyDeath(enemy);
        return false;
      }
      return true;
    });

    // 리젠
    if (this.enemies.length < maxCount && time - this.lastSpawnTime > respawnInterval) {
      this.spawnRandomEnemyNearPlayer(types, patrolRangeX, minPlayerDistance);
      this.lastSpawnTime = time;
    }
  }

  /**
   * 적 사망 처리 (경험치 지급)
   */
  handleEnemyDeath(enemy) {
    if (!enemy || !enemy.expReward) return;

    // GameScene의 경험치 지급 함수 호출
    if (this.scene.onExpGained) {
      const currentCharacterType = this.scene.selectedCharacter || 'soul';
      this.scene.onExpGained(enemy.expReward, currentCharacterType);
    }
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

    // 적 생성 시 AI 설정 추가
    const enemy = new EnemyClass(this.scene, x, this.spawnY, {
      patrolRangeX: patrolRangeX,
      detectRange: this.mapConfig.enemies.detectRange || 200,
      attackRange: this.mapConfig.enemies.attackRange || 70,
      attackDamage: this.mapConfig.enemies.attackDamage || 10,
      attackCooldown: this.mapConfig.enemies.attackCooldown || 1500,
    });

    if (!enemy || !enemy.sprite) {
      console.error('Enemy creation failed');
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
