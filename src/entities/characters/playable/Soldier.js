import CharacterBase from '../base/CharacterBase.js';

export default class Soldier extends CharacterBase {
  constructor(scene, x, y) {
    // Soldier 전용 설정
    const config = {
      spriteKey: 'soldier',
      scale: 1.2,
      walkSpeed: 150, // Soul보다 느림
      runSpeed: 280,
      jumpPower: 250, // 점프력이 낮음
      maxJumps: 1, // 이단 점프 불가
      bodySize: { width: 32, height: 40 },
      bodyOffset: { x: 8, y: 4 },
      attackHitbox: { width: 50, height: 35 }, // 공격 범위가 넓음
      attackDuration: 600, // 공격이 느림
    };

    super(scene, x, y, config);

    // Soldier만의 속성
    this.armor = 100;
    this.shieldActive = false;
  }

  getAnimationConfig() {
    return {
      spriteKey: 'soldier',
      animations: [
        { key: 'idle', start: 0, end: 3, frameRate: 4, repeat: -1 },
        { key: 'walk', start: 8, end: 15, frameRate: 8, repeat: -1 },
        { key: 'run', start: 16, end: 23, frameRate: 10, repeat: -1 },
        { key: 'jump', start: 24, end: 27, frameRate: 8, repeat: 0 },
        { key: 'attack', start: 32, end: 39, frameRate: 10, repeat: 0 },
        { key: 'shield', start: 40, end: 42, frameRate: 5, repeat: -1 }, // 방어 자세
      ],
    };
  }

  // Soldier만의 특수 능력
  activateShield() {
    if (this.shieldActive) return;

    this.shieldActive = true;
    this.stateMachine.changeState('shield');
    this.movement.walkSpeed = 50; // 방어 중에는 느려짐

    this.scene.time.delayedCall(2000, () => {
      this.deactivateShield();
    });
  }

  deactivateShield() {
    this.shieldActive = false;
    this.movement.walkSpeed = this.config.walkSpeed;
  }

  // 방어력 적용
  takeDamage(amount) {
    if (this.shieldActive) {
      amount = Math.floor(amount * 0.3); // 방어 중 70% 감소
    }

    this.armor -= amount;
    if (this.armor <= 0) {
      this.onDeath();
    }
  }

  onDeath() {
    this.destroy();
  }

  // Soldier만의 입력 처리
  handleInput(input) {
    super.handleInput(input);

    // 방어 키 (예: S키)
    if (this.scene.shieldKey && Phaser.Input.Keyboard.JustDown(this.scene.shieldKey)) {
      this.activateShield();
    }
  }
}
