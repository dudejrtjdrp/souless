import ChannelingManager from './ChannelingManager';
import InputHandler from '../../entities/characters/systems/InputHandler';
import SkillHandlerFactory from './SkillHandlers/SkillHandlerFactory';
import { SkillHitbox } from './SkillHitbox';
import { Skill } from './SkillCore/Skill';
import AnimationController from './SkillCore/AnimationController';
import StateLockManager from './SkillCore/StateLockManager';
import SkillValidator from './SkillCore/SkillValidator';
import HitstopManager from '../../systems/HitStopManager';
import { throttle } from '../../utils/throttle'; // throttle import 추가

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

    // GameScene의 EffectManager 사용
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

    // 스킬 키 매핑 (스킬 이름 → UI 키)
    this.skillKeyMapping = {
      q_skill: 'Q',
      dash: 'Q',
      w_skill: 'W',
      e_skill: 'E',
      r_skill: 'R',
      s_skill: 'S',
      attack: 'A',
      basic_attack: 'A',
      melee_attack: 'A',
    };

    //  타격 시 체력/마나 회복 throttle 함수 (500ms 간격)
    this.throttledHealOnHit = throttle(() => {
      this.healOnHit();
    }, 500);

    this.initializeSkills(skillsData);
    this.setupAnimationCompleteListener();
  }

  // 타격 시 체력/마나 회복 처리
  healOnHit() {
    if (!this.character) return;

    const perLevel = this.character.maxHealth / 18;

    const healAmount = 1 * perLevel.toFixed(0);
    console.log(healAmount);

    // 체력 회복 (최대 체력을 넘지 않도록)
    if (this.character.health < this.character.maxHealth) {
      this.character.health = Math.min(
        this.character.health + healAmount,
        this.character.maxHealth,
      );
    }

    // 마나 회복 (최대 마나를 넘지 않도록)
    if (this.character.mana < this.character.maxMana) {
      this.character.mana = Math.min(this.character.mana + healAmount, this.character.maxMana);
    }

    // 회복 이펙트나 로그 추가 가능
    const uiScene = this.scene.scene?.get('UIScene');
    if (uiScene) {
      uiScene.addLog(`타격! +${healAmount} HP/MP 회복`, '#00ff88');
    }
  }

  // 스킬 데이터에서 사용되는 모든 이펙트 미리 로드
  preloadEffects(skillsData) {
    if (!this.effectManager) {
      console.warn('EffectManager not available for preloading');
      return;
    }

    const effectKeys = new Set();

    for (const config of Object.values(skillsData)) {
      if (config.hitbox) {
        const hitboxArray = Array.isArray(config.hitbox) ? config.hitbox : [config.hitbox];
        hitboxArray.forEach((hb) => {
          if (hb.effect) effectKeys.add(hb.effect);
        });
      }

      if (config.hitboxSequence) {
        config.hitboxSequence.forEach((step) => {
          if (step.effect) effectKeys.add(step.effect);
          if (step.hitbox?.effect) effectKeys.add(step.hitbox.effect);
        });
      }

      if (config.impactEffect) {
        effectKeys.add(config.impactEffect);
      }

      if (config.dashEffect) {
        effectKeys.add(config.dashEffect);
      }
      if (config.healEffect) {
        effectKeys.add(config.healEffect);
      }
    }

    if (effectKeys.size === 0) return;

    effectKeys.forEach((key) => {
      this.effectManager.preloadEffect(key);
    });

    const loadCompleteHandler = () => {
      effectKeys.forEach((key) => {
        this.effectManager.createEffectAnimation(key);
      });
      this.scene.load.off('complete', loadCompleteHandler);
    };

    this.scene.load.on('complete', loadCompleteHandler);

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

  /**
   * 스킬 잠금 체크 (개선됨)
   */
  isSkillLocked(skillName) {
    const skillUnlockSystem = this.scene.skillUnlockSystem;
    if (!skillUnlockSystem) return false;

    const skillKey = this.skillKeyMapping[skillName];
    if (!skillKey) return false;

    const isUnlocked = skillUnlockSystem.isSkillUnlocked(skillKey);
    return !isUnlocked;
  }

  /**
   * 스킬 사용 가능 여부 확인 (통합)
   */
  canUseSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (!skill) return false;

    // 스킬 잠금 체크 최우선
    if (this.isSkillLocked(skillName)) {
      this.showSkillLockedMessage(skillName);
      return false;
    }

    // 기존 검증 로직 (쿨타임, 마나, 체력 등)
    return SkillValidator.canUseSkill(this.character, skill, skillName);
  }

  /**
   * 스킬 잠금 메시지 표시
   */
  showSkillLockedMessage(skillName) {
    const skillKey = this.skillKeyMapping[skillName];
    if (!skillKey) return;

    const skillUnlockSystem = this.scene.skillUnlockSystem;
    if (!skillUnlockSystem) return;

    const requiredLevel = skillUnlockSystem.getRequiredLevel(skillKey);
    const currentLevel = skillUnlockSystem.getCharacterLevel();

    const uiScene = this.scene.scene?.get('UIScene');
    if (uiScene) {
      uiScene.addLog(
        `${skillKey} 스킬은 ${requiredLevel}레벨부터 사용 가능합니다. (현재: Lv.${currentLevel})`,
        '#ff6b6b',
      );
    }
  }

  /**
   * 스킬 사용 (개선됨)
   */
  useSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      console.warn(`Skill not found: ${skillName}`);
      return false;
    }

    // 1. 통합 체크 (잠금 + 쿨타임 + 마나 등)
    if (!this.canUseSkill(skillName)) {
      return false;
    }

    // 2. 스킬 사용 처리
    if (!skill.use(this.character)) {
      return false;
    }

    // 3. 스킬 실행
    this.executeSkill(skillName, skill.config);
    return true;
  }

  /**
   * 스킬 실행 (중복 체크 제거)
   */
  executeSkill(skillName, config) {
    // useSkill()에서 이미 체크했으므로 여기서는 제거

    // 이동 스킬이 아니면 캐릭터 정지
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

          if (result.damage !== undefined) {
            result.damage = this.character.calculateDamage(result.damage);
          }

          if (skill?.config.hitstop) {
            this.hitstopManager.triggerPreset(skill.config.hitstop);
          }

          if (skill?.config.isCombo) {
            const comboCount = this.character.comboCounter || 1;
            this.hitstopManager.triggerCombo(comboCount);
          }

          // 타격 성공 시 체력/마나 회복 (throttle 적용)
          this.throttledHealOnHit();

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

  /**
   * 스킬 잠금 상태 정보 반환 (디버깅용)
   */
  getSkillLockInfo(skillName) {
    const skillKey = this.skillKeyMapping[skillName];
    if (!skillKey || !this.scene.skillUnlockSystem) {
      return { locked: false, requiredLevel: 1 };
    }

    return {
      locked: this.isSkillLocked(skillName),
      requiredLevel: this.scene.skillUnlockSystem.getRequiredLevel(skillKey),
      currentLevel: this.scene.skillUnlockSystem.getCharacterLevel(),
    };
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
