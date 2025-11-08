export class Skill {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.cooldownRemaining = 0;
    this.isActive = false;
    this.activeStartTime = 0;
  }

  canUse(character) {
    if (this.cooldownRemaining > 0) return false;

    if (this.config.cost?.mana && character.mana < this.config.cost.mana) {
      return false;
    }

    if (this.config.requiresGround && !character.movement.isOnGround()) {
      return false;
    }

    return true;
  }

  use(character) {
    if (!this.canUse(character)) return false;

    if (this.config.cost?.mana) {
      character.mana -= this.config.cost.mana;
    }

    if (this.config.cooldown) {
      this.cooldownRemaining = this.config.cooldown;
    }

    this.isActive = true;
    this.activeStartTime = Date.now();

    return true;
  }

  update(delta) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }

    if (this.isActive && this.config.duration) {
      const elapsed = Date.now() - this.activeStartTime;
      if (elapsed >= this.config.duration) {
        this.isActive = false;
      }
    }
  }

  isOnCooldown() {
    return this.cooldownRemaining > 0;
  }

  getCooldownPercent() {
    if (!this.config.cooldown) return 0;
    return (this.cooldownRemaining / this.config.cooldown) * 100;
  }
}

export class SkillSystem {
  constructor(scene, character, skillsData) {
    this.scene = scene;
    this.character = character;
    this.skills = new Map();

    for (const [name, config] of Object.entries(skillsData)) {
      this.skills.set(name, new Skill(name, config));
    }
  }

  useSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      console.warn(`Skill not found: ${skillName}`);
      return false;
    }

    if (!skill.use(this.character)) {
      return false;
    }

    const config = skill.config;
    switch (config.type) {
      case 'melee':
        this.handleMeleeSkill(skillName, config);
        break;
      case 'projectile':
        this.handleProjectileSkill(skillName, config);
        break;
      case 'movement':
        this.handleMovementSkill(skillName, config);
        break;
      case 'buff':
        this.handleBuffSkill(skillName, config);
        break;
      case 'instant':
        this.handleInstantSkill(skillName, config);
        break;
    }

    return true;
  }

  handleMeleeSkill(name, config) {
    // 공격 시 즉시 정지 (공중 공격 제외)
    if (name !== 'air_attack' && this.character.sprite.body) {
      this.character.sprite.body.setVelocityX(0);
    }

    // 애니메이션 재생
    this.character.stateMachine.changeState(config.animation);

    // 기본 공격(attack, attack_2, attack_3, air_attack)인 경우 AttackSystem 활성화
    const basicAttacks = ['attack', 'attack_2', 'attack_3', 'air_attack'];
    if (basicAttacks.includes(name)) {
      // AttackSystem 활성화
      if (this.character.attackSystem) {
        this.character.attackSystem.activate();
      }
    } else {
      // 다른 melee 스킬은 activeSkillHitbox 사용
      this.character.activeSkillHitbox = {
        name,
        config,
        startTime: Date.now(),
      };
    }
  }

  handleProjectileSkill(name, config) {
    this.character.stateMachine.changeState(config.animation);

    const isLeft = this.character.sprite.flipX;

    if (this.character.magicSystem) {
      this.character.magicSystem.castSpell(name, isLeft);
    } else {
      console.warn(`MagicSystem not initialized for projectile skill: ${name}`);
    }
  }

  handleMovementSkill(name, config) {
    this.character.stateMachine.changeState(config.animation);

    if (config.distance) {
      const direction = this.character.sprite.flipX ? -1 : 1;
      const speed = config.speed || (config.distance / config.duration) * 1000;
      this.character.sprite.body.velocity.x = direction * speed;

      if (config.invincible) {
        this.character.setInvincible(config.duration);
      }

      this.scene.time.delayedCall(config.duration, () => {
        if (this.character.sprite.body) {
          this.character.sprite.body.velocity.x = 0;
        }
      });
    }
  }

  handleBuffSkill(name, config) {
    this.character.stateMachine.changeState(config.animation);

    this.scene.time.delayedCall(config.duration, () => {
      if (config.effects?.includes('heal')) {
        this.character.heal(config.healAmount || 0);
      }
      if (config.effects?.includes('mana_regen')) {
        this.character.restoreMana(config.manaAmount || 0);
      }
    });
  }

  handleInstantSkill(name, config) {
    this.character.stateMachine.changeState(config.animation);
    this.character.activeSkillHitbox = {
      name,
      config,
      startTime: Date.now(),
    };
  }

  update(delta) {
    for (const skill of this.skills.values()) {
      skill.update(delta);
    }
  }

  getSkill(name) {
    return this.skills.get(name);
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  destroy() {
    this.skills.clear();
  }
}
