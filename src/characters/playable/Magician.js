import CharacterBase from '../base/CharacterBase.js';
import MagicSystem from '../systems/MagicSystem.js';

export default class Magician extends CharacterBase {
  constructor(scene, x, y) {
    const config = {
      spriteKey: 'magician',
      scale: 1,
      walkSpeed: 180,
      runSpeed: 300,
      jumpPower: 350, // 가벼워서 점프력 높음
      maxJumps: 3, // 마법으로 공중 점프 가능
      bodySize: { width: 20, height: 32 },
      bodyOffset: { x: 6, y: 0 },
      attackHitbox: { width: 60, height: 40 }, // 원거리 공격
      attackDuration: 400,
    };

    super(scene, x, y, config);

    // Magician만의 시스템
    this.magicSystem = new MagicSystem(scene, this.sprite);
    this.mana = 100;
    this.maxMana = 100;
  }

  getAnimationConfig() {
    return {
      spriteKey: 'magician',
      animations: [
        { key: 'idle', start: 0, end: 3, frameRate: 3, repeat: -1 },
        { key: 'walk', start: 8, end: 13, frameRate: 8, repeat: -1 },
        { key: 'run', start: 14, end: 19, frameRate: 10, repeat: -1 },
        { key: 'jump', start: 20, end: 23, frameRate: 8, repeat: 0 },
        { key: 'attack', start: 24, end: 29, frameRate: 12, repeat: 0 },
        { key: 'cast', start: 30, end: 37, frameRate: 10, repeat: 0 }, // 마법 시전
        { key: 'teleport', start: 38, end: 43, frameRate: 15, repeat: 0 },
      ],
    };
  }

  initSystems() {
    super.initSystems();
    this.magicSystem = new MagicSystem(this.scene, this.sprite);
  }

  // 마법 공격
  castSpell(spellType = 'fireball') {
    if (this.mana < 20) {
      console.log('Not enough mana!');
      return;
    }

    this.mana -= 20;
    this.stateMachine.changeState('cast');
    this.magicSystem.castSpell(spellType, this.sprite.flipX);
  }

  // 순간이동
  teleport(direction) {
    if (this.mana < 30) {
      console.log('Not enough mana!');
      return;
    }

    this.mana -= 30;
    this.stateMachine.changeState('teleport');

    const distance = 150;
    const targetX = direction === 'left' ? this.sprite.x - distance : this.sprite.x + distance;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.stateMachine.changeState('idle');
      },
    });
  }

  // 마나 회복
  onUpdate(input) {
    // 서있을 때 마나 자동 회복
    if (this.stateMachine.isState('idle') && this.mana < this.maxMana) {
      this.mana += 0.1;
    }
  }

  handleInput(input) {
    super.handleInput(input);

    // 마법 시전 (예: Q키)
    if (this.scene.spellKey && Phaser.Input.Keyboard.JustDown(this.scene.spellKey)) {
      this.castSpell('fireball');
    }

    // 순간이동 (예: E키)
    if (this.scene.teleportKey && Phaser.Input.Keyboard.JustDown(this.scene.teleportKey)) {
      const direction = this.sprite.flipX ? 'left' : 'right';
      this.teleport(direction);
    }
  }

  takeDamage(amount) {
    // 마법사는 체력 대신 마나로 피해를 흡수할 수 있음
    if (this.mana >= amount * 2) {
      this.mana -= amount * 2;
      console.log(`Magician absorbed damage with mana. Mana: ${this.mana}`);
    } else {
      console.log(`Magician took ${amount} damage!`);
      this.onDeath();
    }
  }

  onDeath() {
    console.log('Magician died!');
    // 죽을 때 폭발 이펙트
    this.magicSystem.createExplosion(this.sprite.x, this.sprite.y);
    this.destroy();
  }

  destroy() {
    super.destroy();
    if (this.magicSystem) this.magicSystem.destroy();
  }
}
