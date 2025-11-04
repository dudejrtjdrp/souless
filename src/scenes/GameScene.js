import Player from '../entities/Player';
import Enemy from '../entities/Enemy';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // TODO: 리소스 로드
  }

  create() {
    this.player = new Player(this, 400, 300);
    this.enemy = new Enemy(this, 500, 300);

    // 충돌 설정
    this.physics.add.overlap(
      this.player.sprite,
      this.enemy.sprite,
      this.handleCollision,
      null,
      this,
    );
  }

  handleCollision(playerSprite, enemySprite) {
    this.player.onCollideEnemy(enemySprite);
  }

  update(time, delta) {
    this.player.update(time, delta);
  }
}
