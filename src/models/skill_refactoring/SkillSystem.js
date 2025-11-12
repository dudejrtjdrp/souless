import ChannelingManager from './ChannelingManager';
import InputHandler from '../../characters/systems/InputHandler';
import SkillHandlerFactory from './SkillHandlers/SkillHandlerFactory';
import { SkillHitbox } from './SkillHitbox';
import { Skill } from './SkillCore/Skill';
import AnimationController from './SkillCore/AnimationController';
import StateLockManager from './SkillCore/StateLockManager';
import SkillValidator from './SkillCore/SkillValidator';

export class SkillSystem {
  constructor(scene, character, skillsData) {
    this.scene = scene;
    this.character = character;

    // Core components
    this.skills = new Map();
    this.skillHitboxes = new Map();
    this.inputHandler = new InputHandler(this.scene);

    // Managers
    this.animationController = new AnimationController(character.sprite);
    this.stateLockManager = new StateLockManager(character.stateMachine);
    this.channelingManager = new ChannelingManager(this.inputHandler);

    // Handlers
    this.handlerFactory = new SkillHandlerFactory(
      scene,
      character,
      this.animationController,
      this.stateLockManager,
    );

    this.initializeSkills(skillsData);
    this.setupAnimationCompleteListener();
  }

  setupAnimationCompleteListener() {
    // 애니메이션 완료 이벤트 리스너
    this.character.sprite.on('animationcomplete', (animation) => {
      // 스킬 애니메이션이 완료되면 해당 스킬의 complete() 호출
      for (const [skillName, skill] of this.skills.entries()) {
        if (skill.isActive && !skill.isChanneling) {
          skill.complete();
        }
      }
    });
  }

  initializeSkills(skillsData) {
    for (const [name, config] of Object.entries(skillsData)) {
      this.skills.set(name, new Skill(name, config));

      if (this.needsHitbox(config)) {
        const hitbox = new SkillHitbox(this.scene, this.character.sprite, name, config);
        this.skillHitboxes.set(name, hitbox);
      }
    }
  }

  needsHitbox(config) {
    const hasHitboxType = ['melee', 'instant'].includes(config.type);
    const hasHitboxData = config.hitbox || config.hitboxSequence;
    return hasHitboxType && hasHitboxData;
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

    const skillHitbox = this.skillHitboxes.get(skillName);
    const result = handler.execute(skillName, config, skillHitbox);

    // Channeling 스킬의 경우 키 이름 저장
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

    // 채널링 스킬 완료 처리
    for (const skill of this.skills.values()) {
      if (skill.isChanneling) {
        skill.stopChanneling(); // stopChanneling이 complete()를 호출함
      }
    }
  }

  update(delta) {
    this.updateSkills(delta);
    this.updateChanneling();
    this.inputHandler.updatePrevState();
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

    // 1. 채널링 스킬이 완료되었는지 체크
    if (!skill.isChanneling) {
      this.stopChannelingSkill();
      return;
    }

    // 2. 힐링/마나 회복이 더 이상 필요 없는지 체크
    if (SkillValidator.isHealingSkillUnusable(this.character, skill.config)) {
      this.stopChannelingSkill();
      return;
    }

    this.channelingManager.update(this.character, skill, skill.config, () =>
      this.stopChannelingSkill(),
    );
  }

  // Hitbox 관련 메서드
  checkSkillHit(target) {
    for (const hitbox of this.skillHitboxes.values()) {
      if (hitbox.isActive()) {
        const result = hitbox.checkHit(target);
        if (result) return result;
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

  // Getters
  getSkill(name) {
    return this.skills.get(name);
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  // Cleanup
  destroy() {
    this.character.sprite.off('animationcomplete');
    this.skills.clear();

    for (const hitbox of this.skillHitboxes.values()) {
      hitbox.destroy();
    }
    this.skillHitboxes.clear();

    this.channelingManager.reset();
  }
}
