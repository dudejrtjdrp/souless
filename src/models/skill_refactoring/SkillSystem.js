import ChannelingManager from './ChannelingManager';
import InputHandler from '../../entities/characters/systems/InputHandler';
import SkillHandlerFactory from './SkillHandlers/SkillHandlerFactory';
import { SkillHitbox } from './SkillHitbox';
import { Skill } from './SkillCore/Skill';
import AnimationController from './SkillCore/AnimationController';
import StateLockManager from './SkillCore/StateLockManager';
import SkillValidator from './SkillCore/SkillValidator';
import HitstopManager from '../../systems/HitStopManager';

export class SkillSystem {
  constructor(scene, character, skillsData) {
    this.scene = scene;
    this.character = character;

    // Core components
    this.skills = new Map();
    this.skillHitboxes = new Map();
    this.inputHandler = new InputHandler(this.scene);

    // Managers
    this.stateLockManager = new StateLockManager(character.stateMachine);
    this.channelingManager = new ChannelingManager(this.inputHandler);
    this.animationController = new AnimationController(character.sprite, this.stateLockManager);

    //  GameScene의 EffectManager 사용 (없으면 경고)
    this.effectManager = scene.effectManager;

    if (!this.effectManager) {
      console.warn('⚠️ scene.effectManager not found! Effects will not work.');
    }

    // Handlers
    this.handlerFactory = new SkillHandlerFactory(
      scene,
      character,
      this.animationController,
      this.stateLockManager,
      this.inputHandler,
    );

    this.hitstopManager = new HitstopManager(scene);
    this.isSkillActive = false;

    this.initializeSkills(skillsData);
    this.setupAnimationCompleteListener();
  }

  /**
   * 스킬 데이터에서 사용되는 모든 이펙트 미리 로드
   * (필요시 사용 - 현재는 GameScene에서 일괄 로드)
   */
  preloadEffects(skillsData) {
    if (!this.effectManager) {
      console.warn('EffectManager not available for preloading');
      return;
    }

    const effectKeys = new Set();

    for (const config of Object.values(skillsData)) {
      // 단일 히트박스의 이펙트
      if (config.hitbox) {
        const hitboxArray = Array.isArray(config.hitbox) ? config.hitbox : [config.hitbox];
        hitboxArray.forEach((hb) => {
          if (hb.effect) effectKeys.add(hb.effect);
        });
      }

      // 시퀀스 히트박스의 이펙트
      if (config.hitboxSequence) {
        config.hitboxSequence.forEach((step) => {
          if (step.effect) effectKeys.add(step.effect);
          if (step.hitbox?.effect) effectKeys.add(step.hitbox.effect);
        });
      }

      // 임팩트 이펙트
      if (config.impactEffect) {
        effectKeys.add(config.impactEffect);
      }

      // 대시/힐 이펙트
      if (config.dashEffect) {
        effectKeys.add(config.dashEffect);
      }
      if (config.healEffect) {
        effectKeys.add(config.healEffect);
      }
    }

    if (effectKeys.size === 0) return;

    // 모든 이펙트 로드
    effectKeys.forEach((key) => {
      this.effectManager.preloadEffect(key);
    });

    // 로드 완료 후 애니메이션 생성
    const loadCompleteHandler = () => {
      effectKeys.forEach((key) => {
        this.effectManager.createEffectAnimation(key);
      });
      this.scene.load.off('complete', loadCompleteHandler);
    };

    this.scene.load.on('complete', loadCompleteHandler);

    // 로드가 이미 진행 중이 아니면 시작
    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  setupAnimationCompleteListener() {
    this.character.sprite.on('animationcomplete', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });

    this.character.sprite.on('animationstop', (animation) => {
      this.completeSkillByAnimation(animation.key);
    });
  }

  completeSkillByAnimation(animKey) {
    for (const [skillName, skill] of this.skills.entries()) {
      if (skill.isActive && !skill.isChanneling) {
        const skillAnimKey = skill.config.animation;
        if (!skillAnimKey) continue;

        const characterType = this.character.sprite.texture.key;
        const prefixedKey = `${characterType}-${skillAnimKey}`;

        if (animKey === skillAnimKey || animKey === prefixedKey) {
          skill.complete();
          break;
        }
      }
    }
  }

  initializeSkills(skillsData) {
    for (const [name, config] of Object.entries(skillsData)) {
      this.skills.set(name, new Skill(name, config));

      if (this.needsHitbox(config)) {
        // EffectManager를 히트박스에 전달
        const hitbox = new SkillHitbox(
          this.scene,
          this.character.sprite,
          name,
          config,
          this.effectManager,
        );
        this.skillHitboxes.set(name, hitbox);
      }
    }
  }

  needsHitbox(config) {
    const hasHitboxType = ['melee', 'instant'].includes(config.type);
    const hasHitboxData = config.hitbox || config.hitboxSequence;
    return hasHitboxType && hasHitboxData;
  }

  getAnimationFrameRate(animationKey) {
    const sprite = this.character.sprite;
    const animManager = sprite.anims.animationManager;
    const characterType = sprite.texture.key;
    const prefixedKey = `${characterType}-${animationKey}`;

    const finalAnimKey = animManager.anims.has(prefixedKey) ? prefixedKey : animationKey;
    const anim = animManager.get(finalAnimKey);

    return anim ? anim.frameRate : 10;
  }

  useSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      console.warn(`Skill not found: ${skillName}`);
      return false;
    }

    if (!SkillValidator.canUseSkill(this.character, skill, skillName)) {
      return false;
    }

    if (!skill.use(this.character)) {
      return false;
    }

    this.executeSkill(skillName, skill.config);
    return true;
  }

  executeSkill(skillName, config) {
    if (config.type !== 'movement') {
      this.stopCharacterMovement();
    }

    const handler = this.handlerFactory.getHandler(config.type);
    if (!handler) {
      console.warn(`No handler for skill type: ${config.type}`);
      return;
    }

    if (config.animation) {
      config.frameRate = this.getAnimationFrameRate(config.animation);
    }

    const skillHitbox = this.skillHitboxes.get(skillName);
    const result = handler.execute(skillName, config, skillHitbox);

    const characterType = this.character.sprite.texture.key;
    const prevState = this.character.stateMachine.currentState;
    const prefixedKey = `${characterType}-${prevState}`;

    this.stateLockManager.setPrevState(prefixedKey);

    if (config.type === 'channeling' && result) {
      this.channelingManager.startChanneling(result);
    }
  }

  stopCharacterMovement() {
    if (this.character.sprite.body) {
      this.character.sprite.body.setVelocityX(0);
    }
  }

  stopChannelingSkill() {
    const handler = this.handlerFactory.getHandler('channeling');
    handler.stop(this.animationController, this.stateLockManager);
    this.channelingManager.reset();

    for (const skill of this.skills.values()) {
      if (skill.isChanneling) {
        skill.stopChanneling();
      }
    }
  }

  update(delta) {
    this.updateSkills(delta);
    this.updateChanneling();
    this.inputHandler.updatePrevState();

    //  EffectManager.update()는 GameScene에서 한 번만 호출되므로
    // 여기서는 호출하지 않음 (중복 방지)
  }

  updateSkills(delta) {
    for (const skill of this.skills.values()) {
      skill.update(delta);
    }
  }

  updateChanneling() {
    if (!this.channelingManager.isChanneling()) return;
    this.handlerFactory.getHandler('channeling').update();

    const skillName = `${this.channelingManager.currentKeyName}_skill`;
    const skill = this.skills.get(skillName);

    if (!skill?.config) return;

    if (!skill.isChanneling) {
      this.stopChannelingSkill();
      return;
    }

    if (SkillValidator.isHealingSkillUnusable(this.character, skill.config)) {
      this.stopChannelingSkill();
      return;
    }

    this.channelingManager.update(this.character, skill, skill.config, () =>
      this.stopChannelingSkill(),
    );
  }

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

          if (skill?.config.isCombo) {
            const comboCount = this.character.comboCounter || 1;
            this.hitstopManager.triggerCombo(comboCount);
          }

          return result;
        }
      }
    }
    return false;
  }

  getActiveSkillHitbox() {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) return hitbox;
    }
    return null;
  }

  getSkill(name) {
    return this.skills.get(name);
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  destroy() {
    this.character.sprite.off('animationcomplete');
    this.character.sprite.off('animationstop');
    this.skills.clear();

    for (const hitbox of this.skillHitboxes.values()) {
      hitbox.destroy();
    }
    this.skillHitboxes.clear();

    this.channelingManager.reset();
    this.hitstopManager.destroy();
  }
}
