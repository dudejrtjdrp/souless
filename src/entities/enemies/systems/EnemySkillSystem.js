import { SkillHitbox } from '../../../models/skill_refactoring/SkillHitbox';
import { Skill } from '../../../models/skill_refactoring/SkillCore/Skill';
import AnimationController from '../../../models/skill_refactoring/SkillCore/AnimationController';
import StateLockManager from '../../../models/skill_refactoring/SkillCore/StateLockManager';
import HitstopManager from '../../../systems/HitStopManager';

/**
 * 적 전용 스킬 시스템
 * 객체 형태 스킬 지원 + hitboxSequence 지원
 */
export default class EnemySkillSystem {
  constructor(enemy, scene, skillConfigs) {
    this.enemy = enemy;
    this.scene = scene;

    this.initializeComponents();
    this.initializeSkills(skillConfigs);
    this.setupAnimationCompleteListener();
  }

  initializeComponents() {
    this.skills = new Map();
    this.skillHitboxes = new Map();
    this.tempSequenceHitboxes = new Map();

    this.stateLockManager = this.enemy.stateMachine
      ? new StateLockManager(this.enemy.stateMachine)
      : null;
    this.animationController = new AnimationController(this.enemy.sprite, this.stateLockManager);

    this.effectManager = this.scene.effectManager;
    if (!this.effectManager) {
      console.warn('⚠️ EffectManager not found! Enemy effects disabled.');
    }

    this.hitstopManager = new HitstopManager(this.scene);
  }

  initializeSkills(skillConfigs) {
    const skillArray = this.convertToSkillArray(skillConfigs);

    for (const config of skillArray) {
      if (!config.name) {
        console.warn('⚠️ Skill config missing name:', config);
        continue;
      }

      this.registerSkill(config);
    }
  }

  convertToSkillArray(skillConfigs) {
    if (Array.isArray(skillConfigs)) {
      return skillConfigs;
    }

    if (typeof skillConfigs === 'object') {
      return Object.entries(skillConfigs).map(([name, config]) => ({
        name,
        ...config,
      }));
    }

    return [];
  }

  registerSkill(config) {
    const skill = new Skill(config.name, config);
    this.skills.set(config.name, skill);

    if (this.needsHitbox(config)) {
      const hitbox = new SkillHitbox(
        this.scene,
        this.enemy.sprite,
        config.name,
        config,
        this.effectManager,
      );
      this.skillHitboxes.set(config.name, hitbox);
    }
  }

  needsHitbox(config) {
    const hasHitboxType = ['melee', 'instant', 'aoe', 'movement'].includes(config.type);
    const hasHitboxData = config.hitbox || config.hitboxSequence;
    return hasHitboxType && hasHitboxData;
  }

  setupAnimationCompleteListener() {
    this.enemy.sprite.on('animationcomplete', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });

    this.enemy.sprite.on('animationstop', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });
  }

  completeSkillByAnimation(animKey) {
    for (const [skillName, skill] of this.skills.entries()) {
      if (!this.shouldCompleteSkill(skill, animKey)) continue;

      skill.complete();

      this.resetEnemyState();
      if (this.enemy.controller) {
        this.enemy.controller.isInAttackState = false;
      }
      break;
    }
  }

  shouldCompleteSkill(skill, animKey) {
    if (!skill.isActive || skill.isChanneling) return false;

    const skillAnimKey = skill.config.animation || skill.config.animationKey;
    if (!skillAnimKey) return false;

    const prefixedKey = `${this.enemy.enemyType}_${skillAnimKey}`;
    return animKey === skillAnimKey || animKey === prefixedKey;
  }

  resetEnemyState() {
    this.enemy.isLockingDirection = false;
    this.stopEnemyMovement();
    if (this.enemy.controller) {
      this.enemy.controller.isInAttackState = false;
    }
  }

  stopEnemyMovement() {
    if (this.enemy.sprite.body) {
      this.enemy.sprite.body.setVelocity(0, 0);
    }
  }

  getAnimationFrameRate(animationKey) {
    const sprite = this.enemy.sprite;
    const animManager = sprite.anims.animationManager;
    const prefixedKey = `${this.enemy.enemyType}_${animationKey}`;
    const finalAnimKey = animManager.anims.has(prefixedKey) ? prefixedKey : animationKey;
    const anim = animManager.get(finalAnimKey);

    return anim ? anim.frameRate : 10;
  }

  getDistanceToTarget(target) {
    if (!target?.sprite) return Infinity;

    return Phaser.Math.Distance.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      target.sprite.x,
      target.sprite.y,
    );
  }

  getUsableSkills(target) {
    if (!target) return [];

    const distance = this.getDistanceToTarget(target);

    return Array.from(this.skills.values()).filter((skill) => this.isSkillUsable(skill, distance));
  }

  isSkillUsable(skill, distance) {
    if (!skill.canUse(this.enemy)) return false;
    if (skill.config.range && distance > skill.config.range) return false;

    if (skill.config.hpThreshold) {
      const hpPercent = this.enemy.hp / this.enemy.maxHP;
      if (hpPercent > skill.config.hpThreshold) return false;
    }

    return true;
  }

  useSkill(skillName, target) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      console.warn(`❌ Skill not found: ${skillName}`);
      return false;
    }

    if (!skill.canUse(this.enemy) || !skill.use(this.enemy)) {
      return false;
    }

    this.executeSkill(skillName, skill.config, target);
    return true;
  }

  executeSkill(skillName, config, target) {
    if (config.type !== 'movement') {
      this.stopEnemyMovement();
    }

    const turnInfo = this.calculateTurnInfo(target);

    if (turnInfo.needsTurn) {
      this.executeTurnThenAttack(skillName, config, target, turnInfo);
    } else {
      this.executeAttack(skillName, config, target);
    }
  }

  calculateTurnInfo(target) {
    if (!target?.sprite) {
      return { needsTurn: false, newDirection: this.enemy.direction };
    }

    const newDirection = target.sprite.x > this.enemy.sprite.x ? 1 : -1;
    const needsTurn = this.enemy.direction !== newDirection;

    return { needsTurn, newDirection };
  }

  executeTurnThenAttack(skillName, config, target, turnInfo) {
    const turnDelay = config.turnDelay || 200;

    this.lockAndTurn(turnInfo.newDirection);

    this.scene.time.delayedCall(turnDelay, () => {
      this.startSkillAnimation(skillName, config, target);
    });
  }

  lockAndTurn(newDirection) {
    this.enemy.isLockingDirection = true;
    this.enemy.direction = newDirection;

    const baseFlip = this.enemy.data.sprite.flipX || false;
    this.enemy.sprite.setFlipX(newDirection > 0 ? !baseFlip : baseFlip);
  }

  executeAttack(skillName, config, target) {
    this.enemy.isLockingDirection = true;
    this.startSkillAnimation(skillName, config, target);
  }

  startSkillAnimation(skillName, config, target) {
    this.setAnimationFrameRate(config);
    this.playSkillAnimation(config);

    const hitDelay = config.hitDelay || 300;
    const skillHitbox = this.skillHitboxes.get(skillName);

    this.scene.time.delayedCall(hitDelay, () => {
      this.applySkillEffect(skillName, config, target, skillHitbox);
    });

    if (config.duration && config.type === 'movement') {
      this.scheduleAutoComplete(skillName, hitDelay + config.duration);
    }
  }

  setAnimationFrameRate(config) {
    const animKey = config.animation || config.animationKey;
    if (animKey) {
      config.frameRate = this.getAnimationFrameRate(animKey);
    }
  }

  playSkillAnimation(config) {
    const animKey = config.animation || config.animationKey;
    if (!animKey) return;

    const prefixedKey = `${this.enemy.enemyType}_${animKey}`;

    if (this.scene.anims.exists(prefixedKey)) {
      this.enemy.sprite.play(prefixedKey, true);
    } else {
      console.warn(`⚠️ Animation not found: ${prefixedKey}`);
    }
  }

  scheduleAutoComplete(skillName, totalDuration) {
    this.scene.time.delayedCall(totalDuration, () => {
      const skill = this.skills.get(skillName);
      if (skill?.isActive) {
        skill.complete();
        if (!this.enemy.isDead) {
          this.enemy.sprite.play(`${this.enemy.enemyType}_idle`, true);
        }
        this.resetEnemyState();
      }
    });
  }

  applySkillEffect(skillName, config, target, skillHitbox) {
    const handlers = {
      melee: () => this.handleMeleeSkill(skillName, config, target, skillHitbox),
      instant: () => this.handleMeleeSkill(skillName, config, target, skillHitbox),
      projectile: () => config.createProjectile?.(this.enemy, target, this.scene),
      aoe: () => this.handleAoeSkill(skillName, config, target, skillHitbox),
      buff: () => this.handleBuffSkill(config),
      movement: () => this.handleMovementSkill(skillName, config, target, skillHitbox),
    };

    const handler = handlers[config.type];
    if (handler) {
      handler();
    } else {
      console.warn(`⚠️ Unknown skill type: ${config.type}`);
    }

    if (config.hitstop) {
      this.hitstopManager.triggerPreset(config.hitstop);
    }
  }

  handleMeleeSkill(skillName, config, target, skillHitbox) {
    if (skillHitbox) {
      this.activateSkillHitbox(skillHitbox, config);
    } else {
      console.warn(`⚠️ No hitbox found for ${skillName}, using direct melee`);
      this.handleDirectMelee(config, target);
    }
  }

  handleAoeSkill(skillName, config, target, skillHitbox) {
    if (skillHitbox) {
      this.activateSkillHitbox(skillHitbox, config);
    }

    if (config.visualEffect) {
      this.handleVisualEffect(config.visualEffect, target);
    }
  }

  handleMovementSkill(skillName, config, target, skillHitbox) {
    if (skillHitbox) {
      this.activateSkillHitbox(skillHitbox, config);
    }

    if (config.movement) {
      this.executeMovement(config, target);
    }
  }

  activateSkillHitbox(skillHitbox, config) {
    if (!skillHitbox) return;

    if (config.hitboxSequence) {
      // ✅ SkillHitbox의 activateSequence 사용 (movement 자동 처리)
      skillHitbox.activateSequence(config.hitboxSequence);
    } else {
      this.activateSingleHitbox(skillHitbox, config);
    }
  }

  activateSequenceHitboxes(skillHitbox, config) {
    config.hitboxSequence.forEach((step, index) => {
      const stepDelay = step.delay || 0;

      this.scene.time.delayedCall(stepDelay, () => {
        this.activateSequenceStep(skillHitbox, config, step, index);
      });
    });
  }

  activateSequenceStep(skillHitbox, config, step, index) {
    const tempConfig = this.createTempStepConfig(config, step);
    const tempHitbox = this.createTempHitbox(skillHitbox, index, tempConfig);
    const stepDuration = this.calculateStepDuration(step, config);

    tempHitbox.activate(stepDuration);
    tempHitbox.hitEnemies = skillHitbox.hitEnemies;

    const sequenceKey = `${skillHitbox.name}_${Date.now()}_${index}`;
    this.tempSequenceHitboxes.set(sequenceKey, tempHitbox);

    // ✅ step의 movement 처리 (히트박스 이동)
    if (step.movement) {
      this.executeHitboxMovement(tempHitbox, step.movement);
    }

    // ✅ step의 effect 처리
    if (step.effect && this.effectManager) {
      this.playSequenceEffect(step.effect, tempHitbox);
    }

    this.scheduleHitboxCleanup(tempHitbox, sequenceKey, stepDuration);
  }

  createTempStepConfig(config, step) {
    return {
      ...config,
      hitbox: step.hitbox,
      damage: step.damage || config.damage,
      knockback: step.knockback || config.knockback,
      effects: step.effects || config.effects,
      impactEffect: config.impactEffect,
      targetType: config.targetType,
      hitstop: config.hitstop,
      hitboxSequence: undefined,
    };
  }

  createTempHitbox(skillHitbox, index, tempConfig) {
    return new SkillHitbox(
      this.scene,
      this.enemy.sprite,
      `${skillHitbox.name}_step${index}`,
      tempConfig,
      this.effectManager,
    );
  }

  scheduleHitboxCleanup(tempHitbox, sequenceKey, duration) {
    this.scene.time.delayedCall(duration + 100, () => {
      tempHitbox.destroy();
      this.tempSequenceHitboxes.delete(sequenceKey);
    });
  }

  activateSingleHitbox(skillHitbox, config) {
    const delay = config.hitboxDelay || 0;
    const animationDuration = this.calculateAnimationDuration(config);

    if (delay > 0) {
      this.scene.time.delayedCall(delay, () => skillHitbox.activate(animationDuration));
    } else {
      skillHitbox.activate(animationDuration);
    }
  }

  calculateAnimationDuration(config) {
    if (config.duration) return config.duration;

    const animKey = config.animation || config.animationKey;
    if (!animKey) return 1000;

    const anim = this.getAnimation(animKey);
    if (!anim) return 1000;

    return (anim.frames.length / anim.frameRate) * 1000;
  }

  getAnimation(animKey) {
    const sprite = this.enemy.sprite;
    const animManager = sprite.anims.animationManager;
    const prefixedKey = `${this.enemy.enemyType}_${animKey}`;
    const finalAnimKey = animManager.anims.has(prefixedKey) ? prefixedKey : animKey;
    return animManager.get(finalAnimKey);
  }

  calculateStepDuration(step, config) {
    return step.duration || step.hitbox?.duration || this.calculateAnimationDuration(config);
  }

  handleDirectMelee(config, target) {
    const distance = this.getDistanceToTarget(target);

    if (distance <= (config.range || 100)) {
      target.takeDamage(config.damage || 10);

      if (config.impactEffect && this.effectManager) {
        this.effectManager.playEffect(config.impactEffect, target.sprite.x, target.sprite.y);
      }
    }
  }

  handleBuffSkill(config) {
    if (config.buffs?.speed) {
      this.applySpeedBuff(config);
    }

    if (config.visualEffect?.type === 'aura') {
      this.handleAuraEffect(config.visualEffect, config.duration);
    }
  }

  applySpeedBuff(config) {
    const originalSpeed = this.enemy.speed;
    this.enemy.speed *= config.buffs.speed;

    this.scene.time.delayedCall(config.duration || 3000, () => {
      this.enemy.speed = originalSpeed;
    });
  }

  executeMovement(config, target) {
    const movement = config.movement;
    if (movement.type !== 'dash') return;

    const dashParams = this.calculateDashParameters(config, target);
    this.executeDash(movement, dashParams);
  }

  calculateDashParameters(config, target) {
    const startX = this.enemy.sprite.x;
    const angle = Phaser.Math.Angle.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      target.sprite.x,
      target.sprite.y,
    );

    const maxDashDistance = config.range || 250;
    const currentDistance = this.getDistanceToTarget(target);
    const dashDistance = Math.min(maxDashDistance, currentDistance - 80);

    return { startX, angle, dashDistance };
  }

  executeDash(movement, dashParams) {
    this.enemy.sprite.body.setVelocityX(Math.cos(dashParams.angle) * movement.speed);

    if (movement.afterimage) {
      this.createAfterimage(movement.afterimageCount || 3);
    }

    this.monitorDashProgress(movement, dashParams);
  }

  monitorDashProgress(movement, dashParams) {
    const checkInterval = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        const movedDistance = Math.abs(this.enemy.sprite.x - dashParams.startX);
        const shouldStop =
          movedDistance >= dashParams.dashDistance ||
          checkInterval.getElapsed() >= movement.duration ||
          !this.enemy.sprite.body;

        if (shouldStop) {
          this.stopEnemyMovement();
          checkInterval.remove();
        }
      },
      loop: true,
    });
  }

  // ✅ hitboxSequence의 movement 처리 (distanceX/Y 방식)
  executeSequenceMovement(movement) {
    if (!this.enemy.sprite.body) return;

    const startX = this.enemy.sprite.x;
    const startY = this.enemy.sprite.y;
    const duration = movement.duration || 500;

    // 방향 고려한 이동
    const directionMultiplier = this.enemy.direction || 1;
    const targetX = startX + movement.distanceX * directionMultiplier;
    const targetY = startY + movement.distanceY;

    // Tween으로 부드러운 이동
    this.scene.tweens.add({
      targets: this.enemy.sprite,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.stopEnemyMovement();
      },
    });
  }

  // ✅ hitboxSequence의 effect 재생
  playSequenceEffect(effectKey) {
    if (!this.effectManager) return;

    const x = this.enemy.sprite.x;
    const y = this.enemy.sprite.y;

    this.effectManager.playEffect(effectKey, x, y);
  }

  handleVisualEffect(visualEffect, target) {
    if (visualEffect.type === 'warning_then_explosion') {
      this.createWarningExplosion(visualEffect, target);
    }
  }

  createWarningExplosion(visualEffect, target) {
    const radius = visualEffect.radius || 150;
    const warning = this.createWarningCircle(target, radius, visualEffect);

    this.scene.time.delayedCall(visualEffect.warningDuration, () => {
      warning.destroy();
      this.createExplosion(target, radius, visualEffect);
    });
  }

  createWarningCircle(target, radius, visualEffect) {
    const warning = this.scene.add.circle(
      target.sprite.x,
      target.sprite.y,
      radius,
      visualEffect.warningColor,
      0.2,
    );

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.2, to: 0.5 },
      duration: visualEffect.warningDuration / 2,
      yoyo: true,
      repeat: 1,
    });

    return warning;
  }

  createExplosion(target, radius, visualEffect) {
    const explosion = this.scene.add.circle(
      target.sprite.x,
      target.sprite.y,
      radius,
      visualEffect.explosionColor,
      0.6,
    );

    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => explosion.destroy(),
    });

    if (visualEffect.shake) {
      this.scene.cameras.main.shake(visualEffect.shake.duration, visualEffect.shake.intensity);
    }
  }

  handleAuraEffect(visualEffect, duration) {
    const aura = this.scene.add.circle(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      this.enemy.sprite.width * (visualEffect.scale || 1),
      visualEffect.color,
      visualEffect.alpha,
    );

    const timer = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        if (aura && this.enemy.sprite) {
          aura.setPosition(this.enemy.sprite.x, this.enemy.sprite.y);
        }
      },
      loop: true,
    });

    this.scene.time.delayedCall(duration, () => {
      timer.remove();
      aura.destroy();
    });
  }

  createAfterimage(count) {
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        this.createGhostSprite();
      });
    }
  }

  createGhostSprite() {
    const ghost = this.scene.add.sprite(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      this.enemy.sprite.texture.key,
    );

    ghost.setAlpha(0.3);
    ghost.setTint(0x000000);
    ghost.setScale(this.enemy.sprite.scaleX, this.enemy.sprite.scaleY);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 300,
      onComplete: () => ghost.destroy(),
    });
  }

  checkSkillHit(target) {
    return this.checkRegularHitboxes(target) || this.checkSequenceHitboxes(target);
  }

  checkRegularHitboxes(target) {
    for (const hitbox of this.skillHitboxes.values()) {
      const result = this.checkSingleHitbox(hitbox, target);
      if (result) return result;
    }
    return false;
  }

  checkSequenceHitboxes(target) {
    if (!this.tempSequenceHitboxes) return false;

    for (const [key, hitbox] of this.tempSequenceHitboxes.entries()) {
      const result = this.checkSingleHitbox(hitbox, target, key);
      if (result) return result;
    }
    return false;
  }

  checkSingleHitbox(hitbox, target, key = null) {
    if (!hitbox.isActive()) return false;

    const identifier = key || hitbox.name;

    const result = hitbox.checkHit(target);
    if (!result) return false;

    this.triggerHitstop(key || hitbox.name);

    return result;
  }

  triggerHitstop(identifier) {
    const skillName = identifier.split('_step')[0].split('_')[0];
    const skill = this.skills.get(skillName);

    if (skill?.config.hitstop) {
      this.hitstopManager.triggerPreset(skill.config.hitstop);
    }
  }

  getActiveSkillHitbox() {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) return hitbox;
    }

    for (const hitbox of this.tempSequenceHitboxes.values()) {
      if (hitbox.isActive()) return hitbox;
    }

    return null;
  }

  update(delta) {
    this.updateSkills(delta);
    this.updateHitboxes(delta);
  }

  updateSkills(delta) {
    for (const skill of this.skills.values()) {
      skill.update(delta);
    }
  }

  updateHitboxes(delta) {
    const allHitboxes = [...this.skillHitboxes.values(), ...this.tempSequenceHitboxes.values()];

    for (const hitbox of allHitboxes) {
      hitbox.update?.(delta);
    }
  }

  getSkill(name) {
    return this.skills.get(name);
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  destroy() {
    this.removeEventListeners();
    this.clearSkills();
    this.clearHitboxes();
    this.destroyManagers();
  }

  removeEventListeners() {
    this.enemy.sprite.off('animationcomplete');
    this.enemy.sprite.off('animationstop');
  }

  clearSkills() {
    this.skills.clear();
  }

  clearHitboxes() {
    for (const hitbox of this.skillHitboxes.values()) {
      hitbox.destroy();
    }
    this.skillHitboxes.clear();

    if (this.tempSequenceHitboxes) {
      for (const hitbox of this.tempSequenceHitboxes.values()) {
        hitbox.destroy();
      }
      this.tempSequenceHitboxes.clear();
    }
  }

  destroyManagers() {
    if (this.hitstopManager) {
      this.hitstopManager.destroy();
    }
  }
}
