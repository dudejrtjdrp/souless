import CharacterBase from '../base/CharacterBase.js';
import { CharacterDataAdapter } from '../../utils/CharacterDataAdapter.js';
import { SkillSystem } from '../systems/SkillSystem.js';

export default class Soul extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = CharacterDataAdapter.buildConfig('soul', options);
    super(scene, x, y, config);

    const skillsData = CharacterDataAdapter.getSkillsData('soul');
    this.skillSystem = new SkillSystem(scene, this, skillsData);

    this.maxHealth = 100;
    this.health = 100;
    this.maxMana = 80;
    this.mana = 80;

    this.walkTween = null;
    this.isDashing = false;
  }

  static preload(scene) {
    scene.load.spritesheet('soul', '/assets/characters/soul_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  getAnimationConfig() {
    return CharacterDataAdapter.getAnimationConfig('soul');
  }

  // ✅ updateMovement 오버라이드
  updateMovement(input) {
    if (!this.stateMachine.isStateLocked() && !this.isDashing) {
      this.movement.handleHorizontalMovement(input.cursors, input.isRunning);
    }
  }

  onUpdate(input) {
    this.skillSystem.update(this.scene.game.loop.delta);

    if (input.isAttackPressed) {
      this.performAttack();
    }

    if (input.isQPressed && !this.isDashing) {
      this.performDash();
    }
  }

  performAttack() {
    this.skillSystem.useSkill('attack');
  }

  performDash() {
    const skill = this.skillSystem.getSkill('dash');
    if (!skill) return;

    if (skill.isOnCooldown()) {
      return;
    }

    if (this.skillSystem.useSkill('dash')) {
      this.isDashing = true;

      const direction = this.sprite.flipX ? -1 : 1;
      this.sprite.setVelocityX(direction * 600);

      this.scene.time.delayedCall(300, () => {
        this.isDashing = false;

        // ✅ 대시 끝날 때 현재 입력 상태 확인해서 속도 설정
        const input = this.inputHandler.getInputState();
        const speed = input.isRunning ? this.config.runSpeed : this.config.walkSpeed;

        if (input.cursors.left.isDown) {
          this.sprite.setVelocityX(-speed);
        } else if (input.cursors.right.isDown) {
          this.sprite.setVelocityX(speed);
        } else {
          this.sprite.setVelocityX(0);
        }
      });
    }
  }

  onStateChange(oldState, newState) {
    // 필요시 구현
  }

  destroy() {
    if (this.skillSystem) this.skillSystem.destroy();
    super.destroy();
  }
}
