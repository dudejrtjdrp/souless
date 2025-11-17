export default class EnemySkillSystem {
  constructor(enemy, scene, skillConfigs = []) {
    this.enemy = enemy;
    this.scene = scene;

    // 여러 스킬을 가지는 구조
    this.skills = skillConfigs.map((cfg) => ({
      ...cfg,
      _canUse: true,
    }));
  }

  getUsableSkills(player) {
    return this.skills.filter((skill) => {
      if (!skill._canUse) return false;

      // 사용 조건이 있다면 여기서 체크
      if (skill.range) {
        const distance = Phaser.Math.Distance.Between(
          this.enemy.x,
          this.enemy.y,
          player.x,
          player.y,
        );
        if (distance > skill.range) return false;
      }

      return true;
    });
  }

  useSkill(player) {
    const usable = this.getUsableSkills(player);
    if (usable.length === 0) return;

    // 우선순위가 가장 높은 스킬 사용
    const skill = usable.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

    this._activateSkill(skill, player);
  }

  _activateSkill(skill, player) {
    // 쿨다운 처리
    skill._canUse = false;
    this.scene.time.delayedCall(skill.cooldown, () => (skill._canUse = true));

    // 애니메이션 재생
    if (skill.animationKey) {
      this.enemy.play(skill.animationKey, true);
    }

    // hitDelay 후 실제 효과 적용
    this.scene.time.delayedCall(skill.hitDelay || 300, () => {
      this._applySkillEffect(skill, player);
    });
  }

  _applySkillEffect(skill, player) {
    if (skill.type === 'melee') {
      // 근접 스킬
      const dist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, player.x, player.y);
      if (dist <= (skill.range || 50)) {
        player.takeDamage(skill.damage || 10);
      }
    }

    if (skill.type === 'projectile') {
      // 투사체 생성
      skill.createProjectile(this.enemy, player, this.scene);
    }

    if (skill.type === 'aoe') {
      skill.createAoE(this.enemy, player, this.scene);
    }
  }
}
