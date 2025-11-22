import CharacterBase from '../base/CharacterBase.js';
import { CharacterDataAdapter } from '../../../utils/CharacterDataAdapter.js';
import { SkillSystem } from '../../../models/skill_refactoring/SkillSystem.js';

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

  // ✅ updateMovement 오버라이드 - 오버레이 체크 추가
  updateMovement(input) {
    // ✅ 캐릭터 선택 오버레이 보일 때 이동 멈추기
    const isCharacterSelectVisible = this.scene.characterSelectOverlay?.isVisible || false;

    if (isCharacterSelectVisible) {
      // 속도를 0으로 설정
      if (this.sprite && this.sprite.body) {
        this.sprite.setVelocityX(0);
      }
      return;
    }

    if (!this.stateMachine.isStateLocked() && !this.isDashing) {
      this.movement.handleHorizontalMovement(input.cursors, input.isRunning);
    }
  }

  onUpdate(input) {
    this.skillSystem.update(this.scene.game.loop.delta);

    if (input.isAttackPressed) {
      this.performAttack();
    }

    if (input.isSPressed && !this.isDashing) {
      this.performDash();
    }
  }

  performAttack() {
    this.skillSystem.useSkill('attack');
  }

  performDash() {
    const skill = this.skillSystem.getSkill('s_skill');
    if (!skill) return;

    if (skill.isOnCooldown()) {
      return;
    }

    if (this.skillSystem.useSkill('s_skill')) {
      this.isDashing = true;

      const direction = this.sprite.flipX ? -1 : 1;
      this.sprite.setVelocityX(direction * 600);

      this.scene.time.delayedCall(300, () => {
        this.isDashing = false;

        // ✅ 대시 끝날 때 오버레이 체크 추가
        const isCharacterSelectVisible = this.scene.characterSelectOverlay?.isVisible || false;

        if (isCharacterSelectVisible) {
          // 오버레이가 보이면 속도 0 유지
          this.sprite.setVelocityX(0);
          return;
        }

        // 대시 끝날 때 현재 입력 상태 확인해서 속도 설정
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
