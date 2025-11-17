export default class EnemyAttackSystem {
  constructor(enemy, scene, config) {
    this.enemy = enemy;
    this.scene = scene;

    this.range = config.range;
    this.damage = config.damage;
    this.cooldown = config.cooldown;
    this.hitDelay = config.hitDelay || 200;
    this.animationKey = config.animationKey || 'attack'; // 'attack' 또는 'hit' 등 접미사만 포함

    this._canAttack = true;

    console.log(`✅ EnemyAttackSystem created for ${enemy.enemyType}:`, {
      range: this.range,
      damage: this.damage,
      cooldown: this.cooldown,
    });
  }

  canAttack(player) {
    // 1️⃣ 쿨다운 체크
    if (!this._canAttack) {
      return false; // 로그 제거 (너무 많음)
    }

    // 2️⃣ 플레이어 유효성 체크
    if (!player || player.isDead) {
      return false;
    }

    // 3️⃣ 플레이어 위치 안전하게 가져오기
    const playerX = player.sprite ? player.sprite.x : player.x;
    const playerY = player.sprite ? player.sprite.y : player.y;

    // 4️⃣ 거리 계산
    const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerX, playerY);

    // ✅ 범위를 약간 넓게: range * 1.2
    const canAtk = distance <= this.range * 1.2;

    // 5️⃣ 디버깅 로그 (공격 가능할 때만)
    if (canAtk) {
      console.log(`🎯 ${this.enemy.enemyType} CAN ATTACK:`, {
        distance: distance.toFixed(2),
        range: this.range,
        effectiveRange: (this.range * 1.2).toFixed(2),
      });
    }

    return canAtk;
  }

  attack(player) {
    console.log(`⚔️ ${this.enemy.enemyType}: ATTACK EXECUTED!`);

    // 1️⃣ 쿨다운 체크
    if (!this._canAttack) {
      return;
    }

    // 2️⃣ 플레이어 유효성 체크
    if (!player || player.isDead) {
      return;
    }

    // 3️⃣ 쿨다운 설정
    this._canAttack = false;

    // 4️⃣ 애니메이션 재생
    if (this.scene.anims.exists(this.animationKey)) {
      this.enemy.play(this.animationKey, true);
    }

    // 5️⃣ 실제 데미지 타이밍
    this.scene.time.delayedCall(this.hitDelay, () => {
      if (!player || player.isDead) {
        return;
      }

      const playerX = player.sprite ? player.sprite.x : player.x;
      const playerY = player.sprite ? player.sprite.y : player.y;
      const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerX, playerY);

      // ✅ hitDelay 동안 플레이어가 움직일 수 있으므로 범위를 더 넓게
      if (distance <= this.range * 1.5) {
        if (typeof player.takeDamage === 'function') {
          console.log(`💥 ${this.enemy.enemyType}: Dealing ${this.damage} damage!`);
          player.takeDamage(this.damage);

          if (this.scene.events) {
            this.scene.events.emit('player-stats-updated', player);
          }
        }
      } else {
        console.warn(
          `⚠️ ${this.enemy.enemyType}: Player escaped (distance: ${distance.toFixed(2)})`,
        );
      }
    });

    // 6️⃣ 쿨다운 리셋
    this.scene.time.delayedCall(this.cooldown, () => {
      this._canAttack = true;
      console.log(`🔓 ${this.enemy.enemyType}: Ready to attack again!`);
    });
  }
}
