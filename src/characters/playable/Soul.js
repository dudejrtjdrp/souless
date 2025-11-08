import CharacterBase from '../base/CharacterBase.js';
import { CharacterDataAdapter } from '../../utils/CharacterDataAdapter.js';
import { SkillSystem } from '../systems/SkillSystem.js';

export default class Soul extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    // ✅ CharacterData.js에서 설정 불러오기
    const config = CharacterDataAdapter.buildConfig('soul', options);
    super(scene, x, y, config);

    // ✅ SkillSystem 초기화
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
    // ✅ CharacterData.js에서 애니메이션 설정 불러오기
    return CharacterDataAdapter.getAnimationConfig('soul');
  }

  onUpdate(input) {
    // ✅ SkillSystem 업데이트
    this.skillSystem.update(this.scene.game.loop.delta);

    // ✅ 공격 처리
    if (input.isAttackPressed) {
      this.performAttack();
    }

    // ✅ Q키로 대시
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
      console.log(`Dash cooldown: ${Math.ceil(skill.cooldownRemaining / 1000)}s`);
      return;
    }

    if (this.skillSystem.useSkill('dash')) {
      this.isDashing = true;

      // 대시 이동
      const direction = this.sprite.flipX ? -1 : 1;
      this.sprite.setVelocityX(direction * 600);

      this.scene.time.delayedCall(300, () => {
        this.isDashing = false;
        if (this.sprite.body) {
          this.sprite.setVelocityX(0);
        }
      });
    }
  }

  onStateChange(oldState, newState) {
    if (newState === 'walk' || newState === 'run') {
      this.startWalkTween();
    } else {
      this.stopWalkTween();
    }
  }

  startWalkTween() {
    if (this.walkTween) return;
    this.walkTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopWalkTween() {
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
      this.sprite.y = this.baseY;
    }
  }

  destroy() {
    this.stopWalkTween();
    if (this.skillSystem) this.skillSystem.destroy();
    super.destroy();
  }
}
