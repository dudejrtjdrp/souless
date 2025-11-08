import Phaser from 'phaser';
import AnimationManager from '../systems/AnimationManager.js';
import StateMachine from '../systems/StateMachine.js';
import AttackSystem from '../systems/AttackSystem.js';
import MovementController from '../systems/MovementController.js';
import InputHandler from '../systems/InputHandler.js';
import CharacterNormalizer from '../../utils/CharacterNormalizer.js';

// 모든 캐릭터의 베이스 클래스
export default class CharacterBase {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config);

    // ⭐ 스킬 시스템 초기화 (스프라이트 생성 전에!)
    this.skillHitboxes = {};
    this.activeSkillHitbox = null;

    this.initSprite(x, y);
    this.applyNormalization(); // 스프라이트 생성 후 정규화
    this.initSystems();
    this.setupPhysics();
  }

  // 기본 설정 (각 캐릭터가 오버라이드 가능)
  getDefaultConfig() {
    return {
      spriteKey: 'character',
      spriteScale: 1, // ⭐ 시각적 크기 조정 (자유롭게 설정)
      depth: 100,
      collideWorldBounds: true,

      // ⭐ 충돌 박스 설정 (각 캐릭터가 오버라이드 가능)
      collisionBox: null, // HitboxConfig로 설정

      // ⭐ 공격 히트박스 설정 (각 캐릭터가 오버라이드 가능)
      attackHitbox: null, // HitboxConfig로 설정

      // ⭐ 스킬 히트박스 설정 (각 캐릭터가 오버라이드 가능)
      skillHitboxes: {}, // { skillName: HitboxConfig }

      // 디버그 모드 (충돌 박스 시각화)
      debug: false,

      // 이동 설정
      walkSpeed: 200,
      runSpeed: 350,
      jumpPower: 300,
      maxJumps: 2,

      // 공격 설정
      attackDuration: 500,
    };
  }

  initSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, this.config.spriteKey, 0);
    this.sprite.setDepth(this.config.depth);
    this.sprite.setCollideWorldBounds(this.config.collideWorldBounds);

    // 시각적 스케일 적용 (충돌 박스와 무관)
    this.sprite.setScale(this.config.spriteScale);

    this.baseX = x;
    this.baseY = y;

    console.log(`[${this.config.spriteKey}] 스프라이트 생성:`, {
      scale: this.config.spriteScale.toFixed(3),
      displaySize: {
        width: this.sprite.displayWidth.toFixed(1),
        height: this.sprite.displayHeight.toFixed(1),
      },
    });
  }

  // 핵심: 충돌 박스를 설정
  applyNormalization() {
    // 충돌 박스 설정이 없으면 Soul 기준 사용
    if (!this.config.collisionBox) {
      const normalized = CharacterNormalizer.getStandardizedConfig(
        this.config.spriteScale,
        null, // Soul 기본 오프셋 사용
      );
      this.config.bodySize = normalized.bodySize;
      this.config.bodyOffset = normalized.bodyOffset;
    } else {
      // 캐릭터별 커스텀 충돌 박스 사용
      const collisionBox = this.config.collisionBox;
      this.config.bodySize = {
        width: collisionBox.size.width / this.config.spriteScale,
        height: collisionBox.size.height / this.config.spriteScale,
      };
      this.config.bodyOffset = {
        x: collisionBox.offset.x / this.config.spriteScale,
        y: collisionBox.offset.y / this.config.spriteScale,
      };
    }

    // 공격 히트박스 설정
    if (this.config.attackHitbox) {
      this.config.attackHitboxSize = this.config.attackHitbox.size;
      this.config.attackHitboxOffset = this.config.attackHitbox.offset;
      this.config.attackDuration = this.config.attackHitbox.duration;
    } else {
      // Soul 기본값
      this.config.attackHitboxSize = { width: 40, height: 30 };
      this.config.attackHitboxOffset = { x: 30, y: 0 };
    }

    // 디버그 정보 출력
    if (this.config.debug) {
    }
  }

  setupPhysics() {
    const { width, height } = this.config.bodySize;
    const { x, y } = this.config.bodyOffset;

    // 스케일 역보정된 값 설정
    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset(x, y);

    console.log(`[${this.config.spriteKey}] Physics 설정:`, {
      spriteScale: this.config.spriteScale.toFixed(3),
      setSize: { width: width.toFixed(1), height: height.toFixed(1) },
      actualBodySize: {
        width: this.sprite.body.width.toFixed(1),
        height: this.sprite.body.height.toFixed(1),
      },
    });
  }

  initSystems() {
    const animConfig = this.getAnimationConfig();

    this.animManager = new AnimationManager(this.scene, animConfig);
    this.animManager.createAll();

    this.stateMachine = new StateMachine(
      this.sprite,
      this.animManager,
      this.onStateChange.bind(this),
    );

    this.attackSystem = new AttackSystem(
      this.scene,
      this.sprite,
      this.config.attackHitboxSize,
      this.config.attackDuration,
      this.config.attackHitboxOffset,
    );

    this.movement = new MovementController(this.sprite, {
      walkSpeed: this.config.walkSpeed,
      runSpeed: this.config.runSpeed,
      jumpPower: this.config.jumpPower,
      maxJumps: this.config.maxJumps,
    });

    this.inputHandler = new InputHandler(this.scene);

    this.stateMachine.changeState('idle');
  }

  // 각 캐릭터가 반드시 구현해야 하는 메서드
  getAnimationConfig() {
    throw new Error('getAnimationConfig() must be implemented');
  }

  // 상태 변경 시 호출
  onStateChange(oldState, newState) {
    // 하위 클래스에서 추가 로직 구현
  }

  // 공통 메서드들
  jump() {
    if (this.movement.jump()) {
      this.stateMachine.changeState('jump');
    }
  }

  attack() {
    if (this.stateMachine.isState('attack')) return;

    this.stateMachine.changeState('attack');
    this.attackSystem.activate();
  }

  /**
   * ⭐ 스킬 사용 (히트박스 커스터마이징)
   * @param {string} skillName - 스킬 이름
   * @param {string} animationKey - 애니메이션 키
   */
  useSkill(skillName, animationKey) {
    if (this.activeSkillHitbox) return; // 이미 스킬 사용 중

    const skillConfig = this.config.skillHitboxes[skillName];
    if (!skillConfig) {
      console.warn(`스킬 설정을 찾을 수 없습니다: ${skillName}`);
      return;
    }

    // 애니메이션 재생
    this.stateMachine.changeState(animationKey);

    // 스킬 히트박스 활성화
    this.activeSkillHitbox = {
      name: skillName,
      config: skillConfig,
      startTime: Date.now(),
    };

    console.log(`✨ 스킬 사용: ${skillName}`, skillConfig);
  }

  /**
   * 스킬 히트박스 체크
   */
  checkSkillHit(target) {
    if (!this.activeSkillHitbox) return false;

    const skill = this.activeSkillHitbox;
    const elapsed = Date.now() - skill.startTime;

    // 지속 시간 초과
    if (elapsed > skill.config.duration) {
      this.activeSkillHitbox = null;
      return false;
    }

    // 히트박스 계산
    const facingRight = this.sprite.flipX ? false : true;
    const offsetX = facingRight ? skill.config.offset.x : -skill.config.offset.x;

    const hitboxX = this.sprite.x + offsetX;
    const hitboxY = this.sprite.y + skill.config.offset.y;

    const hitbox = new Phaser.Geom.Rectangle(
      hitboxX - skill.config.size.width / 2,
      hitboxY - skill.config.size.height / 2,
      skill.config.size.width,
      skill.config.size.height,
    );

    // 타겟의 bounds 가져오기
    let targetBounds;
    if (target.getBounds) {
      targetBounds = target.getBounds();
    } else if (target.body) {
      targetBounds = new Phaser.Geom.Rectangle(
        target.body.x,
        target.body.y,
        target.body.width,
        target.body.height,
      );
    } else {
      console.warn('Target has no bounds or body');
      return false;
    }

    if (Phaser.Geom.Rectangle.Overlaps(hitbox, targetBounds)) {
      console.log(`💥 스킬 히트: ${skill.name}`, skill.config.damage);
      return {
        hit: true,
        damage: skill.config.damage,
        knockback: skill.config.knockback,
        effects: skill.config.effects,
      };
    }

    return false;
  }

  checkAttackHit(target) {
    return this.attackSystem.checkHit(target);
  }

  isAttacking() {
    return this.stateMachine.isState('attack') && this.attackSystem.isActive();
  }

  isUsingSkill() {
    return this.activeSkillHitbox !== null;
  }

  takeDamage(amount) {
    console.log(`${this.constructor.name} took ${amount} damage`);
  }

  // 메인 업데이트
  update() {
    const input = this.inputHandler.getInputState();

    this.updateGroundState();
    this.handleInput(input);
    this.updateMovement(input);
    this.updateState(input);
    this.onUpdate(input);
  }

  updateGroundState() {
    if (this.movement.isOnGround()) {
      this.movement.resetJumpCount();
      if (this.stateMachine.isState('jump')) {
        this.stateMachine.changeState('idle');
      }
    }
  }

  handleInput(input) {
    if (input.isJumpPressed) this.jump();
    if (input.isAttackPressed) this.attack();
  }

  updateMovement(input) {
    this.movement.handleHorizontalMovement(input.cursors, input.isRunning);
  }

  updateState(input) {
    if (this.stateMachine.isState('attack')) return;

    const onGround = this.movement.isOnGround();

    if (!onGround) {
      this.stateMachine.changeState('jump');
    } else if (input.isMoving) {
      const newState = input.isRunning ? 'run' : 'walk';
      this.stateMachine.changeState(newState);
    } else {
      this.stateMachine.changeState('idle');
    }
  }

  // 각 캐릭터가 추가 업데이트 로직 구현
  onUpdate(input) {
    // 하위 클래스에서 구현
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.attackSystem) this.attackSystem.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
    if (this.debugText) this.debugText.destroy();
  }
}
