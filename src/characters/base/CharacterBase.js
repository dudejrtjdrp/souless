import Phaser from 'phaser';
import AnimationManager from '../systems/AnimationManager.js';
import StateMachine from '../systems/StateMachine.js';
import AttackSystem from '../systems/AttackSystem.js';
import MovementController from '../systems/MovementController.js';
import InputHandler from '../systems/InputHandler.js';
import CharacterNormalizer from '../../utils/CharacterNormalizer.js';
import SaveManager from '../../utils/SaveManager.js';

export default class CharacterBase {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config || {});
    this.characterType = config.spriteKey || 'warrior';

    this.maxHealth = 100;
    this.health = 100;
    this.maxMana = 100;
    this.mana = 100;
    this.isInvincible = false;
    this.invincibleTimer = null;

    this.activeSkillHitbox = null;

    this.initSprite(x, y);
    this.applyNormalization();
    this.initSystems();
    this.setupPhysics();

    this.debugGraphics = null;
    if (this.config.debug) {
      this.debugGraphics = this.scene.add.graphics();
    }
  }

  async loadSavedResources() {
    try {
      const savedResources = await SaveManager.getCharacterResources(this.characterType);

      if (savedResources) {
        this.health = savedResources.hp;
        this.mana = savedResources.mp;

        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ ${this.characterType} 체력/마나 복원 실패:`, error);
      return false;
    }
  }

  async saveResources() {
    try {
      await SaveManager.saveCharacterResources(this.characterType, this.health, this.mana);

      return true;
    } catch (error) {
      console.error(`❌ ${this.characterType} 체력/마나 저장 실패:`, error);
      return false;
    }
  }

  getDefaultConfig() {
    return {
      spriteKey: 'character',
      spriteScale: 1,
      depth: 100,
      collideWorldBounds: true,
      collisionBox: null,
      attackHitbox: null,
      skillHitboxes: {},
      debug: false,
      walkSpeed: 200,
      runSpeed: 350,
      jumpPower: 300,
      maxJumps: 2,
      attackDuration: 500,
    };
  }

  initSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, this.config.spriteKey, 0);
    this.sprite.setDepth(this.config.depth);
    this.sprite.setCollideWorldBounds(this.config.collideWorldBounds);
    this.sprite.setScale(this.config.spriteScale);
    this.baseX = x;
    this.baseY = y;
  }

  applyNormalization() {
    if (!this.config.collisionBox) {
      const normalized = CharacterNormalizer.getStandardizedConfig(this.config.spriteScale, null);
      this.config.bodySize = normalized.bodySize;
      this.config.bodyOffset = normalized.bodyOffset;
    } else {
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

    // 2. 공격 히트박스 설정
    // 우선순위: skills.attack.hitbox > attackHitbox (레거시) > 기본값
    if (this.config.skills?.attack?.hitbox) {
      const attackHitbox = this.config.skills.attack.hitbox;
      const hitboxData = Array.isArray(attackHitbox) ? attackHitbox[0] : attackHitbox;

      this.config.attackHitboxSize = {
        width: hitboxData.width,
        height: hitboxData.height,
      };
      this.config.attackHitboxOffset = {
        x: hitboxData.offsetX || 0,
        y: hitboxData.offsetY || 0,
      };
      this.config.attackDuration =
        hitboxData.duration || this.config.skills.attack.hitboxDuration || 200;
    }
    // 레거시 지원
    else if (this.config.attackHitbox) {
      this.config.attackHitboxSize = this.config.attackHitbox.size;
      this.config.attackHitboxOffset = this.config.attackHitbox.offset;
      this.config.attackDuration = this.config.attackHitbox.duration || 200;
    }
    // 기본값
    else {
      this.config.attackHitboxSize = { width: 40, height: 30 };
      this.config.attackHitboxOffset = { x: 30, y: 0 };
      this.config.attackDuration = 200;
    }
  }

  setupPhysics() {
    const { width, height } = this.config.bodySize;
    const { x, y } = this.config.bodyOffset;
    if (this.sprite.body) {
      this.sprite.body.setSize(width, height);
      this.sprite.body.setOffset(x, y);
    }
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

    const attackTargetType = this.config.skills?.attack?.targetType || 'single';

    this.attackSystem = new AttackSystem(
      this.scene,
      this.sprite,
      this.config.attackHitboxSize,
      this.config.attackDuration,
      this.config.attackHitboxOffset,
      attackTargetType,
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

  getAnimationConfig() {
    throw new Error('getAnimationConfig() must be implemented by subclass');
  }

  onStateChange(oldState, newState) {
    // 하위 클래스에서 확장 가능
  }

  jump() {
    if (this.movement.jump()) {
      this.stateMachine.changeState('jump');
    }
  }

  checkSkillHit(target) {
    if (this.skillSystem) {
      return this.skillSystem.checkSkillHit(target);
    }
    return false;
  }

  checkAttackHit(target) {
    return this.attackSystem.checkHit(target);
  }

  isAttacking() {
    return this.attackSystem.isActive();
  }

  isUsingSkill() {
    if (this.skillSystem) {
      return this.skillSystem.getActiveSkillHitbox() !== null;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.isInvincible) return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.onDeath();
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  restoreMana(amount) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  consumeMana(amount) {
    if (this.mana < amount) return false;
    this.mana -= amount;
    return true;
  }

  setInvincible(duration) {
    this.isInvincible = true;

    if (this.invincibleTimer) {
      clearTimeout(this.invincibleTimer);
    }

    this.invincibleTimer = setTimeout(() => {
      this.isInvincible = false;
    }, duration);
  }

  onDeath() {}

  update() {
    const input = this.inputHandler.getInputState();

    this.movement.update();

    if (!this.stateMachine.isStateLocked()) {
      this.handleInput(input);
      this.updateMovement(input);
      this.updateState(input);
    }

    if (typeof this.onUpdate === 'function') {
      this.onUpdate(input);
    }

    this.renderDebug();
  }

  handleInput(input) {
    if (input.isJumpPressed) {
      this.jump();
    }
    if (input.isEPressed) {
    }
    if (input.isEReleased) {
    }
  }

  updateMovement(input) {
    if (!this.stateMachine.isStateLocked()) {
      this.movement.handleHorizontalMovement(input.cursors, input.isRunning);
    }
  }

  updateState(input) {
    if (this.stateMachine.isStateLocked()) {
      return;
    }

    const onGround = this.movement.isOnGround();

    if (!onGround) {
      const velocityY = this.sprite.body.velocity.y;

      if (velocityY < 0) {
        this.stateMachine.changeState('jump');
      } else {
        this.stateMachine.changeState('jump_down');
      }
    } else if (input.isMoving) {
      const newState = input.isRunning ? 'run' : 'walk';
      this.stateMachine.changeState(newState);
    } else {
      this.stateMachine.changeState('idle');
    }
  }

  renderDebug() {
    if (this.config.debug && this.debugGraphics) {
      this.debugGraphics.clear();

      const b = this.sprite.body;
      if (b) {
        this.debugGraphics.lineStyle(2, 0x00ff00, 0.8);
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }

      if (this.isAttacking()) {
        const hitbox = this.attackSystem.getHitboxBounds();
        if (hitbox) {
          this.debugGraphics.lineStyle(2, 0xff0000, 0.8);
          this.debugGraphics.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }
      }

      if (this.skillSystem) {
        const activeSkillHitbox = this.skillSystem.getActiveSkillHitbox();
        if (activeSkillHitbox) {
          const boundsArray = activeSkillHitbox.getHitboxBounds();
          if (boundsArray) {
            this.debugGraphics.lineStyle(2, 0x0000ff, 0.8);
            if (Array.isArray(boundsArray)) {
              boundsArray.forEach((bounds) => {
                this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
              });
            } else {
              this.debugGraphics.strokeRect(
                boundsArray.x,
                boundsArray.y,
                boundsArray.width,
                boundsArray.height,
              );
            }
          }
        }
      }
    }
  }

  async gainExp(amount) {
    if (amount <= 0) return;

    // SaveManager에 경험치 저장
    await SaveManager.addExp(amount, this.characterType);

    // GameScene에 이벤트 발생 알림
    if (this.scene && this.scene.events) {
      this.scene.onExpGained(amount, this.characterType);
    }

    // 경험치 획득 이펙트 표시 (선택사항)
    this.showExpGainEffect(amount);
  }

  showExpGainEffect(amount) {
    // 캐릭터 위에 +EXP 텍스트 표시
    const expText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 50, `+${amount} EXP`, {
        fontSize: '16px',
        color: '#ffd43b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // 위로 떠오르면서 페이드아웃
    this.scene.tweens.add({
      targets: expText,
      y: expText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        expText.destroy();
      },
    });
  }

  destroy() {
    if (this.inputHandler) this.inputHandler.destroy();
    if (this.stateMachine) this.stateMachine.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.attackSystem) this.attackSystem.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
  }
}
