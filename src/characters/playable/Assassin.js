import CharacterBase from '../base/CharacterBase.js';
import { CharacterDataAdapter } from '../../utils/CharacterDataAdapter.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import MagicSystem from '../systems/MagicSystem.js';

export default class Assassin extends CharacterBase {
  constructor(scene, x, y, options = {}) {
    const config = CharacterDataAdapter.buildConfig('assassin', options);

    // ✅ 수정: 전달받은 x, y를 그대로 사용 (포탈 위치 강제 제거)
    super(scene, x, y, config);

    // SkillSystem 초기화
    const skillsData = CharacterDataAdapter.getSkillsData('assassin');
    this.skillSystem = new SkillSystem(scene, this, skillsData);
    this.magicSystem = new MagicSystem(scene, this.sprite);

    // 상태 변수
    this.maxHealth = 120;
    this.health = 120;
    this.maxMana = 150;
    this.mana = 150;
    console.log(x, y);
  }

  static preload(scene) {
    scene.load.spritesheet('assassin', '/assets/characters/assassin_spritesheet.png', {
      frameWidth: 288,
      frameHeight: 128,
    });
  }

  getAnimationConfig() {
    return CharacterDataAdapter.getAnimationConfig('assassin');
  }

  onUpdate(input) {
    const delta = this.scene.game.loop.delta;
    this.skillSystem.update(delta);
    if (!this.movement) return;

    // 이동 업데이트
    this.movement.update();

    // 상태 잠금 시 입력 무시
    if (this.stateMachine.isStateLocked()) return;

    // 1️⃣ 공중 공격 (A)
    if (!this.movement.isOnGround() && input.isAttackPressed) {
      this.skillSystem.useSkill('air_attack');
      return;
    }

    // 2️⃣ 지상 공격 콤보 (A)
    if (input.isAttackPressed) {
      const result = this.skillSystem.useSkill('attack');
    }

    // 3️⃣ Q/W/E/R/S 스킬
    const skillKeys = [
      { key: 'Q', skill: 'attack_2', pressed: input.isQPressed },
      { key: 'W', skill: 'attack_3', pressed: input.isWPressed },
      { key: 'E', skill: 'defend', pressed: input.isEPressed },
      { key: 'R', skill: 'special_attack', pressed: input.isRPressed },
      { key: 'S', skill: 'roll', pressed: input.isSPressed },
    ];

    skillKeys.forEach(({ skill, pressed }) => {
      if (!pressed) return;

      const skillName = this.skillSystem.getSkill(skill);
      if (!skillName) return;

      // 쿨타임 체크
      if (skillName.isOnCooldown()) return;
      this.skillSystem.useSkill(skill);
    });
  }

  destroy() {
    if (this.skillSystem) this.skillSystem.destroy();
    if (this.magicSystem) this.magicSystem.destroy();
    super.destroy();
  }
}
