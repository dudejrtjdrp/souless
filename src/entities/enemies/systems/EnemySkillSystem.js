import { SkillHitbox } from '../../../models/skill_refactoring/SkillHitbox';
import { Skill } from '../../../models/skill_refactoring/SkillCore/Skill';
import AnimationController from '../../../models/skill_refactoring/SkillCore/AnimationController';
import StateLockManager from '../../../models/skill_refactoring/SkillCore/StateLockManager';
import HitstopManager from '../../../systems/HitStopManager';

/**
 * 적 전용 스킬 시스템
 * 객체 형태 스킬 지원
 */
export default class EnemySkillSystem {
  constructor(enemy, scene, skillConfigs) {
    this.enemy = enemy;
    this.scene = scene;

    // Core components
    this.skills = new Map();
    this.skillHitboxes = new Map();

    // Managers
    this.stateLockManager = enemy.stateMachine ? new StateLockManager(enemy.stateMachine) : null;

    this.animationController = new AnimationController(enemy.sprite, this.stateLockManager);

    // EffectManager 연동
    this.effectManager = scene.effectManager;
    if (!this.effectManager) {
      console.warn('⚠️ EffectManager not found! Enemy effects disabled.');
    }

    // Hitstop
    this.hitstopManager = new HitstopManager(scene);

    // ✅ 스킬 초기화 (배열 또는 객체 모두 지원)
    this.initializeSkills(skillConfigs);
    this.setupAnimationCompleteListener();

    console.log(`✅ Enemy SkillSystem: ${this.skills.size} skills loaded`);
  }

  /**
   * 스킬 초기화 (객체 또는 배열 지원)
   */
  initializeSkills(skillConfigs) {
    // ✅ 객체 형태면 배열로 변환
    let skillArray = [];

    if (Array.isArray(skillConfigs)) {
      skillArray = skillConfigs;
    } else if (typeof skillConfigs === 'object') {
      // 객체를 배열로 변환 { fireSlash: {...} } → [{ name: 'fireSlash', ... }]
      skillArray = Object.entries(skillConfigs).map(([name, config]) => ({
        name,
        ...config,
      }));
    }

    for (const config of skillArray) {
      if (!config.name) {
        console.warn('⚠️ Skill config missing name:', config);
        continue;
      }

      // Skill 객체 생성
      const skill = new Skill(config.name, config);
      this.skills.set(config.name, skill);

      // 히트박스가 필요한 스킬
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
  }

  /**
   * 히트박스 필요 여부 판단
   */
  needsHitbox(config) {
    const hasHitboxType = ['melee', 'instant', 'aoe'].includes(config.type);
    const hasHitboxData = config.hitbox || config.hitboxSequence;
    return hasHitboxType && hasHitboxData;
  }

  /**
   * 애니메이션 완료 리스너
   */
  setupAnimationCompleteListener() {
    this.enemy.sprite.on('animationcomplete', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });

    this.enemy.sprite.on('animationstop', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });
  }

  /**
   * 애니메이션 완료 시 스킬 종료
   */
  completeSkillByAnimation(animKey) {
    for (const [skillName, skill] of this.skills.entries()) {
      if (skill.isActive && !skill.isChanneling) {
        const skillAnimKey = skill.config.animation || skill.config.animationKey;
        if (!skillAnimKey) continue;

        const enemyType = this.enemy.enemyType;
        const prefixedKey = `${enemyType}_${skillAnimKey}`;

        if (animKey === skillAnimKey || animKey === prefixedKey) {
          skill.complete();
          console.log(`✅ Skill completed: ${skillName}`);

          // idle로 복귀
          if (!this.enemy.isDead) {
            this.enemy.sprite.play(`${enemyType}_idle`, true);
          }
          break;
        }
      }
    }
  }

  /**
   * 애니메이션 프레임레이트 가져오기
   */
  getAnimationFrameRate(animationKey) {
    const sprite = this.enemy.sprite;
    const animManager = sprite.anims.animationManager;
    const enemyType = this.enemy.enemyType;
    const prefixedKey = `${enemyType}_${animationKey}`;

    const finalAnimKey = animManager.anims.has(prefixedKey) ? prefixedKey : animationKey;
    const anim = animManager.get(finalAnimKey);

    return anim ? anim.frameRate : 10;
  }

  /**
   * 타겟과의 거리 계산
   */
  getDistanceToTarget(target) {
    if (!target || !target.sprite) return Infinity;

    return Phaser.Math.Distance.Between(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      target.sprite.x,
      target.sprite.y,
    );
  }

  /**
   * 사용 가능한 스킬 목록 반환
   */
  getUsableSkills(target) {
    if (!target) return [];

    const distance = this.getDistanceToTarget(target);

    return Array.from(this.skills.values()).filter((skill) => {
      if (!skill.canUse(this.enemy)) return false;

      if (skill.config.range && distance > skill.config.range) {
        return false;
      }

      if (skill.config.hpThreshold) {
        const hpPercent = this.enemy.hp / this.enemy.maxHP;
        if (hpPercent > skill.config.hpThreshold) return false;
      }

      return true;
    });
  }

  /**
   * 특정 스킬 사용
   */
  useSkill(skillName, target) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      console.warn(`❌ Skill not found: ${skillName}`);
      return false;
    }

    if (!skill.canUse(this.enemy)) {
      return false;
    }

    if (!skill.use(this.enemy)) {
      return false;
    }

    console.log(`🔥 ${this.enemy.enemyType} uses ${skillName}`);

    // 스킬 실행
    this.executeSkill(skillName, skill.config, target);
    return true;
  }

  /**
   * 스킬 실행 핵심 로직
   */
  executeSkill(skillName, config, target) {
    // 이동 정지
    if (config.type !== 'movement') {
      this.stopEnemyMovement();
    }

    // 프레임레이트 설정
    if (config.animation || config.animationKey) {
      const animKey = config.animation || config.animationKey;
      config.frameRate = this.getAnimationFrameRate(animKey);
    }

    // 애니메이션 재생
    this.playSkillAnimation(config);

    // hitDelay 후 효과 적용
    const hitDelay = config.hitDelay || 300;
    const skillHitbox = this.skillHitboxes.get(skillName);

    this.scene.time.delayedCall(hitDelay, () => {
      this.applySkillEffect(skillName, config, target, skillHitbox);
    });
  }

  /**
   * 스킬 애니메이션 재생
   */
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

  /**
   * 이동 정지
   */
  stopEnemyMovement() {
    if (this.enemy.sprite.body) {
      this.enemy.sprite.body.setVelocityX(0);
      this.enemy.sprite.body.setVelocityY(0);
    }
  }

  /**
   * 스킬 효과 적용
   */
  applySkillEffect(skillName, config, target, skillHitbox) {
    switch (config.type) {
      case 'melee':
      case 'instant':
        if (skillHitbox) {
          skillHitbox.activate();
        } else {
          this.handleDirectMelee(config, target);
        }
        break;

      case 'projectile':
        if (config.createProjectile) {
          config.createProjectile(this.enemy, target, this.scene);
        }
        break;

      case 'aoe':
        if (skillHitbox) {
          skillHitbox.activate();
        }
        // ✅ visualEffect 설정 처리
        if (config.visualEffect) {
          this.handleVisualEffect(config.visualEffect, target);
        }
        break;

      case 'buff':
        this.handleBuffSkill(config);
        break;

      case 'movement':
        this.handleMovementSkill(config, target);
        break;

      default:
        console.warn(`⚠️ Unknown skill type: ${config.type}`);
    }

    // Hitstop 효과
    if (config.hitstop) {
      this.hitstopManager.triggerPreset(config.hitstop);
    }
  }

  /**
   * 직접 근접 공격 처리
   */
  handleDirectMelee(config, target) {
    const distance = this.getDistanceToTarget(target);

    if (distance <= (config.range || 100)) {
      target.takeDamage(config.damage || 10);
      console.log(`⚔️ Direct melee: ${config.damage} damage`);

      if (config.impactEffect && this.effectManager) {
        this.effectManager.playEffect(config.impactEffect, target.sprite.x, target.sprite.y);
      }
    }
  }

  /**
   * 버프 스킬 처리
   */
  handleBuffSkill(config) {
    console.log(`✨ Buff applied: ${config.name}`);

    if (config.buffs) {
      if (config.buffs.speed) {
        const originalSpeed = this.enemy.speed;
        this.enemy.speed *= config.buffs.speed;

        this.scene.time.delayedCall(config.duration || 3000, () => {
          this.enemy.speed = originalSpeed;
        });
      }
    }

    // ✅ visualEffect 처리
    if (config.visualEffect && config.visualEffect.type === 'aura') {
      this.handleAuraEffect(config.visualEffect, config.duration);
    }
  }

  /**
   * 이동 스킬 처리
   */
  handleMovementSkill(config, target) {
    if (config.movement) {
      const movement = config.movement;

      if (movement.type === 'dash') {
        const angle = Phaser.Math.Angle.Between(
          this.enemy.sprite.x,
          this.enemy.sprite.y,
          target.sprite.x,
          target.sprite.y,
        );

        // 대시
        this.enemy.sprite.body.setVelocityX(Math.cos(angle) * movement.speed);

        // 잔상 효과
        if (movement.afterimage) {
          this.createAfterimage(movement.afterimageCount || 3);
        }

        // duration 후 정지
        this.scene.time.delayedCall(movement.duration, () => {
          if (this.enemy.sprite.body) {
            this.enemy.sprite.body.setVelocityX(0);
          }
        });
      }
    }
  }

  /**
   * 시각 효과 처리 (함수 없이)
   */
  handleVisualEffect(visualEffect, target) {
    if (visualEffect.type === 'warning_then_explosion') {
      const radius = visualEffect.radius || 150;

      // 경고
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

      // 폭발
      this.scene.time.delayedCall(visualEffect.warningDuration, () => {
        warning.destroy();

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

        // 화면 흔들림
        if (visualEffect.shake) {
          this.scene.cameras.main.shake(visualEffect.shake.duration, visualEffect.shake.intensity);
        }
      });
    }
  }

  /**
   * 오라 효과
   */
  handleAuraEffect(visualEffect, duration) {
    const aura = this.scene.add.circle(
      this.enemy.sprite.x,
      this.enemy.sprite.y,
      this.enemy.sprite.width * (visualEffect.scale || 1),
      visualEffect.color,
      visualEffect.alpha,
    );

    const followAura = () => {
      if (aura && this.enemy.sprite) {
        aura.x = this.enemy.sprite.x;
        aura.y = this.enemy.sprite.y;
      }
    };

    const timer = this.scene.time.addEvent({
      delay: 16,
      callback: followAura,
      loop: true,
    });

    this.scene.time.delayedCall(duration, () => {
      timer.remove();
      aura.destroy();
    });
  }

  /**
   * 잔상 생성
   */
  createAfterimage(count) {
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 100, () => {
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
      });
    }
  }

  /**
   * 히트 체크
   */
  checkSkillHit(target) {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) {
        const result = hitbox.checkHit(target);
        if (result) {
          const skillName = hitbox.name;
          const skill = this.skills.get(skillName);

          if (skill?.config.hitstop) {
            this.hitstopManager.triggerPreset(skill.config.hitstop);
          }

          return result;
        }
      }
    }
    return false;
  }

  /**
   * 활성 히트박스 가져오기
   */
  getActiveSkillHitbox() {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) return hitbox;
    }
    return null;
  }

  /**
   * 매 프레임 업데이트
   */
  update(delta) {
    for (const skill of this.skills.values()) {
      skill.update(delta);
    }

    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.update) {
        hitbox.update(delta);
      }
    }
  }

  /**
   * 스킬 가져오기
   */
  getSkill(name) {
    return this.skills.get(name);
  }

  /**
   * 모든 스킬 가져오기
   */
  getAllSkills() {
    return Array.from(this.skills.values());
  }

  /**
   * 정리
   */
  destroy() {
    this.enemy.sprite.off('animationcomplete');
    this.enemy.sprite.off('animationstop');

    this.skills.clear();

    for (const hitbox of this.skillHitboxes.values()) {
      hitbox.destroy();
    }
    this.skillHitboxes.clear();

    if (this.hitstopManager) {
      this.hitstopManager.destroy();
    }
  }
}
