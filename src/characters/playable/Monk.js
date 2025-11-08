import CharacterBase from '../base/CharacterBase.js';
import { CharacterDataAdapter } from '../../utils/CharacterDataAdapter.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import MagicSystem from '../systems/MagicSystem.js';

export default class Monk extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = CharacterDataAdapter.buildConfig('monk', options);

    const portals = {
      x: scene.mapModel.getPortal()[0].x,
      y: scene.mapModel.getPortal()[0].y,
    };

    let bodyOffsetY = 0;
    if (config.collisionBox) {
      bodyOffsetY = config.collisionBox.offset.y / config.spriteScale;
    }

    super(scene, portals.x, portals.y - bodyOffsetY, config);

    const skillsData = CharacterDataAdapter.getSkillsData('monk');
    this.skillSystem = new SkillSystem(scene, this, skillsData);
    this.magicSystem = new MagicSystem(scene, this.sprite);

    // 콤보 관련 변수 초기화
    this.comboCount = 0;
    this.lastComboTime = 0;
    this.comboWindow = 450; // 콤보 허용 시간(ms)

    this.maxHealth = 120;
    this.health = 120;
    this.maxMana = 150;
    this.mana = 150;
  }

  static preload(scene) {
    scene.load.spritesheet('monk', '/assets/characters/monk_spritesheet.png', {
      frameWidth: 288,
      frameHeight: 128,
    });
  }

  getAnimationConfig() {
    return CharacterDataAdapter.getAnimationConfig('monk');
  }

  onUpdate(input) {
    if (this.movement) {
      this.movement.update();
    }

    this.skillSystem.update(this.scene.game.loop.delta);

    // 상태가 잠겨있으면 입력 무시
    if (this.stateMachine.isStateLocked()) {
      return;
    }

    // 공격 처리
    if (input.isAttackPressed) {
      if (!this.movement.isOnGround()) {
        this.performAirAttack();
      } else {
        this.performComboAttack();
      }
    }

    // 스킬 키바인딩 (원래대로)
    if (input.isQPressed) this.useSkillWithFeedback('fireball');
    if (input.isWPressed) this.useSkillWithFeedback('ice_shard');
    if (input.isEPressed) this.useSkillWithFeedback('meditate');
    if (input.isRPressed) this.useSkillWithFeedback('lightning');
    if (input.isSPressed) this.useSkillWithFeedback('roll');
  }

  performComboAttack() {
    const now = this.scene.time.now;

    // 콤보 타임아웃 체크
    if (now - this.lastComboTime > this.comboWindow) {
      this.comboCount = 0;
    }

    const comboSkills = ['attack', 'attack_2', 'attack_3'];
    const skillName = comboSkills[this.comboCount];

    // 스킬 사용 시도
    const used = this.skillSystem.useSkill(skillName);

    if (used) {
      this.comboCount = (this.comboCount + 1) % comboSkills.length;
      this.lastComboTime = now;
    } else {
      // 사용 실패 시 콤보 초기화
      this.comboCount = 0;
    }
  }

  performAirAttack() {
    this.skillSystem.useSkill('air_attack');
  }

  useSkillWithFeedback(skillName) {
    const skill = this.skillSystem.getSkill(skillName);
    if (!skill) return;

    if (skill.isOnCooldown()) {
      console.log(`${skillName} cooldown: ${Math.ceil(skill.cooldownRemaining / 1000)}s`);
      return;
    }

    if (!this.skillSystem.useSkill(skillName)) {
      console.log(`Cannot use ${skillName}`);
    }
  }

  onStateChange(oldState, newState) {
    // 공격 상태가 끝나면 콤보 초기화 (안정성을 위해)
    if (oldState.includes('attack') && newState === 'idle') {
      // 딜레이 후 콤보 초기화 (원래 코드 유지)
      this.scene.time.delayedCall(1000, () => {
        this.comboCount = 0;
      });
    }
  }

  destroy() {
    if (this.skillSystem) this.skillSystem.destroy();
    if (this.magicSystem) this.magicSystem.destroy();
    super.destroy();
  }
}
