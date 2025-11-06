import Phaser from 'phaser';
import AnimationManager from '../systems/AnimationManager.js';
import StateMachine from '../systems/StateMachine.js';
import AttackSystem from '../systems/AttackSystem.js';
import MovementController from '../systems/MovementController.js';
import InputHandler from '../systems/InputHandler.js';

// 모든 캐릭터의 베이스 클래스
export default class CharacterBase {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config);

    this.initSprite(x, y);
    this.initSystems();
    this.setupPhysics();
  }

  // 기본 설정 (각 캐릭터가 오버라이드 가능)
  getDefaultConfig() {
    return {
      spriteKey: 'character',
      scale: 1,
      depth: 100,
      bodySize: { width: 24, height: 30 },
      bodyOffset: { x: 4, y: 2 },
      collideWorldBounds: true,
      // 이동 설정
      walkSpeed: 200,
      runSpeed: 350,
      jumpPower: 300,
      maxJumps: 2,
      // 공격 설정
      attackHitbox: { width: 40, height: 30 },
      attackDuration: 500,
      attackOffset: { x: 30, y: 0 },
    };
  }

  initSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, this.config.spriteKey, 0);
    this.sprite.setScale(this.config.scale);
    this.sprite.setDepth(this.config.depth);
    this.sprite.setCollideWorldBounds(this.config.collideWorldBounds);

    this.baseY = y;
  }

  setupPhysics() {
    const { width, height } = this.config.bodySize;
    const { x, y } = this.config.bodyOffset;

    this.sprite.body.setSize(width, height);
    this.sprite.body.setOffset(x, y);
  }

  initSystems() {
    // 애니메이션 설정 가져오기
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
      this.config.attackHitbox,
      this.config.attackDuration,
      this.config.attackOffset,
    );

    this.movement = new MovementController(this.sprite, {
      walkSpeed: this.config.walkSpeed,
      runSpeed: this.config.runSpeed,
      jumpPower: this.config.jumpPower,
      maxJumps: this.config.maxJumps,
    });

    this.inputHandler = new InputHandler(this.scene);

    // 초기 상태를 idle로 설정
    this.stateMachine.changeState('idle');
  }

  // 각 캐릭터가 반드시 구현해야 하는 메서드
  getAnimationConfig() {
    throw new Error('getAnimationConfig() must be implemented');
  }

  // 상태 변경 시 호출 (각 캐릭터가 오버라이드 가능)
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

  checkAttackHit(target) {
    return this.attackSystem.checkHit(target);
  }

  isAttacking() {
    return this.stateMachine.isState('attack') && this.attackSystem.isActive();
  }

  takeDamage(amount) {
    // 기본 데미지 처리 (각 캐릭터가 오버라이드 가능)
    console.log(`${this.constructor.name} took ${amount} damage`);
  }

  // 메인 업데이트
  update() {
    const input = this.inputHandler.getInputState();

    this.updateGroundState();
    this.handleInput(input);
    this.updateMovement(input);
    this.updateState(input);
    this.onUpdate(input); // 커스텀 업데이트
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
  }
}
