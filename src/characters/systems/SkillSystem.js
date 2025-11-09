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

export class SkillHitbox {
  constructor(scene, sprite, name, config) {
    this.scene = scene;
    this.sprite = sprite;
    this.name = name;
    this.config = config;
    this.active = false;
    this.hitEnemies = new Set();
    this.hitboxes = [];

    if (config.hitbox) {
      const hitboxArray = Array.isArray(config.hitbox) ? config.hitbox : [config.hitbox];
      hitboxArray.forEach((hitboxData) => {
        this.createHitbox(hitboxData);
      });
    }
  }

  createHitbox(hitboxData) {
    const hitbox = this.scene.add.rectangle(
      0,
      0,
      hitboxData.width,
      hitboxData.height,
      0x00ff00,
      0.15,
    );
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    this.hitboxes.push({
      rect: hitbox,
      offsetX: hitboxData.offsetX,
      offsetY: hitboxData.offsetY,
    });
  }

  activate() {
    if (this.hitboxes.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();
    this.updatePosition();

    this.hitboxes.forEach((h) => {
      h.rect.setVisible(true);
      h.rect.setFillStyle(0xff0000, 0.4);
      this.scene.children.bringToTop(h.rect);
    });

    this.scene.time.delayedCall(this.config.duration, () => {
      this.deactivate();
    });
  }

  activateSequence(sequence) {
    if (!sequence || sequence.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();

    const activeHitboxes = [];

    sequence.forEach((step, index) => {
      this.scene.time.delayedCall(step.delay || 0, () => {
        // 임시 히트박스 생성
        const tempHitbox = this.scene.add.rectangle(
          0,
          0,
          step.hitbox.width,
          step.hitbox.height,
          0xff0000,
          0.4,
        );
        this.scene.physics.add.existing(tempHitbox);
        tempHitbox.body.setAllowGravity(false);

        const flipX = this.sprite.flipX;
        const offsetX = flipX ? -step.hitbox.offsetX : step.hitbox.offsetX;
        tempHitbox.setPosition(this.sprite.x + offsetX, this.sprite.y + step.hitbox.offsetY);

        // 각 단계마다 독립적인 데미지와 설정
        const tempHitboxData = {
          rect: tempHitbox,
          offsetX: step.hitbox.offsetX,
          offsetY: step.hitbox.offsetY,
          damage: step.damage || this.config.damage,
          knockback: step.knockback || this.config.knockback,
          effects: step.effects || this.config.effects,
        };

        this.hitboxes.push(tempHitboxData);
        activeHitboxes.push(tempHitboxData);

        // 히트박스 유지 시간 200ms
        this.scene.time.delayedCall(200, () => {
          const idx = this.hitboxes.indexOf(tempHitboxData);
          if (idx > -1) {
            this.hitboxes.splice(idx, 1);
          }
          const activeIdx = activeHitboxes.indexOf(tempHitboxData);
          if (activeIdx > -1) {
            activeHitboxes.splice(activeIdx, 1);
          }
          tempHitbox.destroy();
        });
      });
    });

    // 전체 시퀀스 종료 시 비활성화
    const totalDuration = Math.max(...sequence.map((s) => s.delay || 0)) + 300;
    this.scene.time.delayedCall(totalDuration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hitEnemies.clear();

    this.hitboxes.forEach((h) => {
      h.rect.setFillStyle(0x00ff00, 0.15);
    });
  }

  updatePosition() {
    if (!this.active) return;

    const flipX = this.sprite.flipX;

    this.hitboxes.forEach((hitbox) => {
      const offsetX = flipX ? -hitbox.offsetX : hitbox.offsetX;
      const x = this.sprite.x + offsetX;
      const y = this.sprite.y + hitbox.offsetY;
      hitbox.rect.setPosition(x, y);
    });
  }

  checkHit(target) {
    if (!this.active || this.hitboxes.length === 0 || !target) {
      return false;
    }

    const targetSprite = target.sprite || target;
    if (!targetSprite?.getBounds) {
      return false;
    }

    const enemyId = targetSprite.name || targetSprite;

    // single 타입: 이미 아무 적이라도 맞췄으면 더 이상 못 맞춤
    if (this.config.targetType === 'single' && this.hitEnemies.size > 0) {
      return false;
    }

    // single 타입이면서 이미 이 적을 맞췄으면 못 맞춤
    if (this.config.targetType === 'single' && this.hitEnemies.has(enemyId)) {
      return false;
    }

    this.updatePosition();

    const targetBounds = targetSprite.getBounds();

    for (const hitbox of this.hitboxes) {
      const bounds = hitbox.rect.getBounds();
      const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);

      if (hit) {
        this.hitEnemies.add(enemyId);

        // 각 히트박스의 독립적인 데미지와 설정 반환
        return {
          hit: true,
          damage: hitbox.damage || this.config.damage || 0,
          knockback: hitbox.knockback || this.config.knockback || { x: 0, y: 0 },
          effects: hitbox.effects || this.config.effects || [],
          targetType: this.config.targetType,
        };
      }
    }

    return false;
  }

  isActive() {
    return this.active;
  }

  getHitboxBounds() {
    if (!this.active || this.hitboxes.length === 0) return null;
    return this.hitboxes.map((h) => h.rect.getBounds());
  }

  destroy() {
    this.hitboxes.forEach((hitbox) => {
      if (hitbox.rect) {
        hitbox.rect.destroy();
      }
    });
    this.hitboxes = [];
    this.hitEnemies.clear();
  }
}

export class SkillSystem {
  constructor(scene, character, skillsData) {
    this.scene = scene;
    this.character = character;
    this.skills = new Map();
    this.skillHitboxes = new Map();

    for (const [name, config] of Object.entries(skillsData)) {
      this.skills.set(name, new Skill(name, config));

      // hitbox 또는 hitboxSequence가 있으면 SkillHitbox 생성
      if (
        (config.type === 'melee' || config.type === 'instant') &&
        (config.hitbox || config.hitboxSequence)
      ) {
        const skillHitbox = new SkillHitbox(scene, character.sprite, name, config);
        this.skillHitboxes.set(name, skillHitbox);
      }
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

    const isInAir = this.character.sprite.body && !this.character.sprite.body.touching.down;

    const airAllowedSkills = ['air_attack', 'roll'];
    if (isInAir && !airAllowedSkills.includes(skillName)) {
      return false;
    }

    if (config.type !== 'movement' && this.character.sprite.body) {
      this.character.sprite.body.setVelocityX(0);
    }

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
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const skillHitbox = this.skillHitboxes.get(name);
    if (skillHitbox) {
      const delay = config.hitboxDelay || 0;

      if (delay > 0) {
        this.scene.time.delayedCall(delay, () => {
          skillHitbox.activate();
        });
      } else {
        skillHitbox.activate();
      }
    }
  }

  handleProjectileSkill(name, config) {
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const isLeft = this.character.sprite.flipX;

    if (this.character.magicSystem) {
      this.character.magicSystem.castSpell(name, isLeft);
    } else {
      console.warn(`해당 스킬이 없습니다: ${name}`);
    }
  }

  handleMovementSkill(name, config) {
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

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
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

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
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const skillHitbox = this.skillHitboxes.get(name);
    if (skillHitbox) {
      // hitboxSequence가 있으면 시퀀스 실행
      if (config.hitboxSequence) {
        skillHitbox.activateSequence(config.hitboxSequence);
      } else {
        // 기존 방식
        const delay = config.hitboxDelay || 0;
        if (delay > 0) {
          this.scene.time.delayedCall(delay, () => {
            skillHitbox.activate();
          });
        } else {
          skillHitbox.activate();
        }
      }
    }
  }

  playAnimationWithDuration(animationKey, frameRate) {
    const sprite = this.character.sprite;

    if (!sprite || !sprite.anims) {
      console.error('[SkillSystem] Sprite or anims is null');
      return 0;
    }

    let finalAnimKey = animationKey;

    const characterType = sprite.texture.key;
    const prefixedKey = `${characterType}-${animationKey}`;

    const animManager = sprite.anims.animationManager;
    const hasAnimation = animManager.anims.has(prefixedKey);

    if (hasAnimation) {
      finalAnimKey = prefixedKey;
    } else {
      if (!animManager.anims.has(animationKey)) {
        console.error(
          `[SkillSystem] Animation '${animationKey}' and '${prefixedKey}' do not exist`,
        );
        return 0;
      }
      finalAnimKey = animationKey;
    }

    const anim = animManager.get(finalAnimKey);
    if (!anim) {
      console.error(`[SkillSystem] Could not get animation '${finalAnimKey}'`);
      return 0;
    }

    const frameCount = anim.frames.length;
    const castTime = (frameCount / frameRate) * 1000;

    sprite.anims.play(finalAnimKey, true);

    if (sprite.anims.currentAnim) {
      sprite.anims.currentAnim.frameRate = frameRate;
      sprite.anims.msPerFrame = 1000 / frameRate;
    }

    if (this.character.stateMachine) {
      this.character.stateMachine.currentState = finalAnimKey;
      this.character.stateMachine.isLocked = true;

      if (this.character.stateMachine.lockTimer) {
        clearTimeout(this.character.stateMachine.lockTimer);
      }

      this.character.stateMachine.lockTimer = setTimeout(() => {
        if (this.character.stateMachine) {
          this.character.stateMachine.isLocked = false;
          this.character.stateMachine.lockTimer = null;

          const onGround = this.character.sprite.body?.touching.down || false;
          if (this.character.stateMachine.changeState) {
            this.character.stateMachine.changeState(onGround ? 'idle' : 'jump');
          }
        }
      }, castTime);
    }

    return castTime;
  }

  checkSkillHit(target) {
    for (const [name, hitbox] of this.skillHitboxes.entries()) {
      if (hitbox.isActive()) {
        const result = hitbox.checkHit(target);
        if (result) {
          return result;
        }
      }
    }
    return false;
  }

  getActiveSkillHitbox() {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) {
        return hitbox;
      }
    }
    return null;
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
    for (const hitbox of this.skillHitboxes.values()) {
      hitbox.destroy();
    }
    this.skillHitboxes.clear();
  }
}
