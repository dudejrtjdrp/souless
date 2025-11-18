import EnemyController from './EnemyController.js';

export default class BossController extends EnemyController {
  constructor(enemy, config = {}) {
    super(enemy, config);

    this.skillCooldown = config.skillCooldown || 3000;
    this.lastSkillTime = 0; // 마지막 스킬 사용 시간

    // skillNames에서 스킬 목록 가져오기
    this.skills = config.skills || [];

    console.log(`👑 BossController initialized:`, {
      boss: enemy.enemyType,
      attackRange: this.attackRange,
      detectRange: this.detectRange,
      skillCooldown: this.skillCooldown,
      skills: this.skills,
    });
  }

  update(time, delta) {
    // 부모 클래스의 기본 AI (추적, 공격) 실행
    super.update(time, delta);

    // 타겟이 없으면 스킬도 사용 안 함
    if (!this.target) return;

    // 스킬 쿨다운 체크 후 랜덤 스킬 사용
    const timeSinceLastSkill = time - this.lastSkillTime;
    if (timeSinceLastSkill >= this.skillCooldown) {
      this.castRandomSkill(time);
    }
  }

  castRandomSkill(time) {
    if (!this.skills || this.skills.length === 0) {
      console.warn('⚠️ No skills available for', this.enemy.enemyType);
      return;
    }

    // 랜덤 스킬 선택
    const skillName = Phaser.Utils.Array.GetRandom(this.skills);

    console.log(`🔮 ${this.enemy.enemyType} casting skill: ${skillName}`);

    // 스킬 시전
    this.enemy.castSkill(skillName);

    // 쿨다운 갱신
    this.lastSkillTime = time;
  }
}
