// BossController.js
import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillCooldown = config.skillCooldown || 3000;
    this.lastSkill = 0;

    this.skills = config.skills || ['meteor', 'dash_smash', 'multi_fireball', 'ground_wave'];
  }

  update(time, delta) {
    super.update(time, delta);

    // 스킬 사용 가능하면 스킬 발동
    if (!this.target) return;

    if (time - this.lastSkill >= this.skillCooldown) {
      this.lastSkill = time;
      this.castSkill();
    }
  }

  castSkill() {
    const skillName = Phaser.Utils.Array.GetRandom(this.skills);
    this.enemy.castSkill(skillName);
  }
}
