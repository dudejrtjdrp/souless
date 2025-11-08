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
      h.rect.setVisible(true); // 반드시 visible 먼저!
      h.rect.setFillStyle(0xff0000, 0.4); // 빨강으로 활성화 표시
      this.scene.children.bringToTop(h.rect); // 혹시 가려질 경우 대비
    });

    this.scene.time.delayedCall(this.config.duration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hitEnemies.clear();

    this.hitboxes.forEach((h) => {
      h.rect.setFillStyle(0x00ff00, 0.15); // 연한 초록색으로 비활성 표시
      // visible을 false로 하지 말고 색만 바꿔!
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

    if (this.hitEnemies.has(enemyId)) {
      return false;
    }

    this.updatePosition();

    const targetBounds = targetSprite.getBounds();

    for (const hitbox of this.hitboxes) {
      const bounds = hitbox.rect.getBounds();
      const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);

      if (hit) {
        this.hitEnemies.add(enemyId);
        console.log(`[SkillHitbox] Hit enemy ${enemyId}, total hit: ${this.hitEnemies.size}`);
        return {
          hit: true,
          damage: this.config.damage || 0,
          knockback: this.config.knockback || { x: 0, y: 0 },
          effects: this.config.effects || [],
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

      if ((config.type === 'melee' || config.type === 'instant') && config.hitbox) {
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

    // ✅ 공중 상태 체크 (air_attack 제외하고 지상에서만 스킬 사용 가능)
    const isInAir = this.character.sprite.body && !this.character.sprite.body.touching.down;
    const airAllowedSkills = ['air_attack', 'roll']; // roll도 허용 스킬에 포함
    if (isInAir && !airAllowedSkills.includes(skillName)) {
      console.log(`[SkillSystem] Cannot use ${skillName} in air`);
      return false;
    }

    // ✅ 스킬 사용 시 즉시 이동 중단 (movement 타입 제외)
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
    // ✅ frameRate로 애니메이션 재생 (castTime 자동 계산)
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const basicAttacks = ['attack'];
    if (basicAttacks.includes(name)) {
      if (this.character.attackSystem) {
        this.character.attackSystem.activate();
      }
    } else {
      const skillHitbox = this.skillHitboxes.get(name);
      if (skillHitbox) {
        const delay = config.hitboxDelay || 0;

        if (delay > 0) {
          console.log(`[SkillSystem] ${name} hitbox will activate after ${delay}ms`);
          this.scene.time.delayedCall(delay, () => {
            skillHitbox.activate();
            console.log(`[SkillSystem] Activated hitbox for ${name}`);
          });
        } else {
          skillHitbox.activate();
          console.log(`[SkillSystem] Activated hitbox for ${name}`);
        }
      }
    }
  }

  handleProjectileSkill(name, config) {
    // ✅ frameRate로 애니메이션 재생
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const isLeft = this.character.sprite.flipX;

    if (this.character.magicSystem) {
      this.character.magicSystem.castSpell(name, isLeft);
    } else {
      console.warn(`MagicSystem not initialized for projectile skill: ${name}`);
    }
  }

  handleMovementSkill(name, config) {
    // ✅ frameRate로 애니메이션 재생
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
    // ✅ frameRate로 애니메이션 재생
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
    // ✅ frameRate로 애니메이션 재생
    const frameRate = config.frameRate || 10;
    this.playAnimationWithDuration(config.animation, frameRate);

    const skillHitbox = this.skillHitboxes.get(name);
    if (skillHitbox) {
      const delay = config.hitboxDelay || 0;

      if (delay > 0) {
        console.log(`[SkillSystem] ${name} hitbox will activate after ${delay}ms`);
        this.scene.time.delayedCall(delay, () => {
          skillHitbox.activate();
          console.log(`[SkillSystem] Activated hitbox for instant skill ${name}`);
        });
      } else {
        skillHitbox.activate();
        console.log(`[SkillSystem] Activated hitbox for instant skill ${name}`);
      }
    }
  }

  /**
   * ✅ 애니메이션을 지정된 frameRate로 재생하고, castTime 자동 계산
   * @param {string} animationKey - 재생할 애니메이션 키
   * @param {number} frameRate - 원하는 프레임 레이트 (fps)
   * @returns {number} castTime - 애니메이션 총 재생 시간 (밀리초)
   */
  playAnimationWithDuration(animationKey, frameRate) {
    const sprite = this.character.sprite;

    if (!sprite || !sprite.anims) {
      console.error('[SkillSystem] Sprite or anims is null');
      return 0;
    }

    // ✅ prefix 확인 및 추가
    let finalAnimKey = animationKey;

    // sprite.texture.key에서 캐릭터 타입 가져오기
    const characterType = sprite.texture.key; // 'soul', 'monk' 등
    const prefixedKey = `${characterType}-${animationKey}`;

    // ✅ prefixed 키가 존재하는지 직접 확인
    const animManager = sprite.anims.animationManager;
    const hasAnimation = animManager.anims.has(prefixedKey);

    if (hasAnimation) {
      finalAnimKey = prefixedKey;
    } else {
      // 원본 키도 확인
      if (!animManager.anims.has(animationKey)) {
        console.error(
          `[SkillSystem] Animation '${animationKey}' and '${prefixedKey}' do not exist`,
        );

        // ✅ 디버그: 사용 가능한 애니메이션 목록 출력
        const availableAnims = Array.from(animManager.anims.keys());
        console.log('[SkillSystem] Available animations:', availableAnims);

        return 0;
      }
      finalAnimKey = animationKey;
    }

    // 애니메이션 정보 가져오기
    const anim = animManager.get(finalAnimKey);
    if (!anim) {
      console.error(`[SkillSystem] Could not get animation '${finalAnimKey}'`);
      return 0;
    }

    const frameCount = anim.frames.length;

    // ✅ frameRate로부터 castTime 계산
    const castTime = (frameCount / frameRate) * 1000;

    console.log(
      `[SkillSystem] Playing ${finalAnimKey}: ${frameCount} frames at ${frameRate} fps → ${castTime.toFixed(
        0,
      )}ms`,
    );

    // ✅ 애니메이션 재생
    sprite.anims.play(finalAnimKey, true);

    // ✅ frameRate 설정
    if (sprite.anims.currentAnim) {
      sprite.anims.currentAnim.frameRate = frameRate;
      sprite.anims.msPerFrame = 1000 / frameRate;
    }

    // StateMachine 상태 변경 및 잠금
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

          // ✅ 애니메이션 종료 후 idle/jump로 전환
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
          console.log(`[SkillSystem] Hit detected with skill ${name}`);
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
