import Phaser from 'phaser';
import AnimationManager from '../systems/AnimationManager.js';
import StateMachine from '../systems/StateMachine.js';
import AttackSystem from '../systems/AttackSystem.js';
import MovementController from '../systems/MovementController.js';
import InputHandler from '../systems/InputHandler.js';
import CharacterNormalizer from '../../../utils/CharacterNormalizer.js';
import SaveSlotManager from '../../../utils/SaveSlotManager.js';

export default class CharacterBase {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config || {});
    this.characterType = config.spriteKey || 'soul';

    this.maxHealth = 100;
    this.health = 100;
    this.maxMana = 100;
    this.mana = 100;

    this.strength = 1; // 물리 공격력 배수 (기본 1)
    this.defense = 0; // 방어력 (기본 0)

    this.isInvincible = false;
    this.invincibleTimer = null;

    this.isKnockedBack = false;

    this.activeSkillHitbox = null;
    this.isDying = false;

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
      const savedResources = await SaveSlotManager.getCharacterResources(this.characterType);

      if (savedResources) {
        // 스탯을 먼저 로드 (maxHealth, maxMana 포함)
        if (savedResources.stats) {
          this.setStats(savedResources.stats);
        }

        // HP가 0이면 최소한 10%는 회복 (사망 루프 방지)
        const minHealth = Math.max(10, Math.floor(this.maxHealth * 0.1));
        this.health = Math.max(minHealth, Math.min(savedResources.hp, this.maxHealth));

        this.mana = Math.min(savedResources.mp, this.maxMana);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`${this.characterType} 리소스 복원 실패:`, error);
      return false;
    }
  }

  async saveResources() {
    try {
      // 스탯 포함해서 저장
      await SaveSlotManager.saveCharacterResources(
        this.characterType,
        this.health,
        this.mana,
        this.getStats(),
      );

      return true;
    } catch (error) {
      console.error(`${this.characterType} 리소스 저장 실패:`, error);
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
    } else if (this.config.attackHitbox) {
      this.config.attackHitboxSize = this.config.attackHitbox.size;
      this.config.attackHitboxOffset = this.config.attackHitbox.offset;
      this.config.attackDuration = this.config.attackHitbox.duration || 200;
    } else {
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

    // AttackSystem에 this (character) 전달
    this.attackSystem = new AttackSystem(
      this.scene,
      this.sprite,
      this.config.attackHitboxSize,
      this.config.attackDuration,
      this.config.attackHitboxOffset,
      attackTargetType,
      this, // character 참조 전달
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
    if (this.isInvincible || this.isDying) {
      return;
    }

    const actualDamage = this.calculateDamageTaken(amount);
    this.health = Math.max(0, this.health - actualDamage);

    // //  무적 상태 설정 (1초)
    // this.setInvincible(500);

    // //  히트 플래시 효과
    // this.playHitFlash();

    this.scene.events.emit('player-damaged');
    this.scene.events.emit('player-hit');

    // ✅ 체력이 0 이하이면 사망 처리
    if (this.health <= 0 && !this.isDying) {
      this.onDeath();
    }
  }

  playHitFlash() {
    if (!this.sprite) return;

    // 기존 트윈 정지
    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
    }

    // 새로운 깜빡임 트윈
    this.invincibilityTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 9, // 총 1초 동안 깜빡임
      onComplete: () => {
        if (this.sprite) {
          this.sprite.setAlpha(1);
        }
        this.invincibilityTween = null;
      },
    });
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

    // 기존 타이머가 있다면 제거
    if (this.invincibleTimer) {
      this.invincibleTimer.remove(false);
      this.invincibleTimer = null;
    }

    // 깜빡임 트윈이 있으면 제거
    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
      this.invincibilityTween = null;
    }

    // 스프라이트 강제 불투명
    if (this.sprite) {
      this.sprite.setAlpha(1);
    }

    // 새로운 무적 타이머 설정
    this.invincibleTimer = this.scene.time.delayedCall(duration, () => {
      this.releaseInvincibility();
    });
  }

  releaseInvincibility() {
    if (this.invincibleTimer) {
      this.invincibleTimer.remove(false);
      this.invincibleTimer = null;
    }

    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
      this.invincibilityTween = null;
    }

    this.isInvincible = false;

    if (this.sprite) {
      this.sprite.setAlpha(1);
      this.scene.tweens.killTweensOf(this.sprite);
    }
  }

  forceReleaseInvincibility() {
    // 타이머 강제 해제
    if (this.invincibleTimer) {
      this.invincibleTimer.remove(false);
      this.invincibleTimer = null;
    }

    // 트윈 강제 정지
    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
      this.invincibilityTween = null;
    }

    this.isInvincible = false;

    // 스프라이트 상태 초기화
    if (this.sprite) {
      this.sprite.setAlpha(1);
      this.scene.tweens.killTweensOf(this.sprite);
    }
  }

  async onDeath() {
    if (this.isDying) return;
    this.isDying = true;
    this.scene.setDeath(this.isDying);

    await this.playDeathAnimation();

    const ghostSpawnX = this.sprite.x;
    const ghostSpawnY = this.sprite.y;

    const ghostSprite = this.createFloatingGhost(ghostSpawnX, ghostSpawnY);

    await this.showRespawnPrompt(ghostSprite);

    // 완전 재시작으로 변경
    await this.handleRespawn(ghostSprite);
  }

  async playDeathAnimation() {
    return new Promise((resolve) => {
      if (this.sprite.body) {
        this.sprite.setVelocityX(0);
        this.sprite.setVelocityY(0);
      }

      if (this.stateMachine) {
        this.stateMachine.changeState('death');
        this.stateMachine.lock(2000);
      }

      this.scene.cameras.main.shake(300, 0.02);

      this.scene.time.delayedCall(2000, () => {
        if (this.sprite.anims) {
          this.sprite.anims.pause();
        }
        resolve();
      });
    });
  }

  createFloatingGhost(x, y) {
    const ghost = this.scene.add.sprite(x, y, this.config.spriteKey, 0);
    ghost.setTint(0x6666ff);
    ghost.setAlpha(0.6);
    ghost.setDepth(this.config.depth - 1);

    this.scene.tweens.add({
      targets: ghost,
      y: y - 30,
      duration: 1500,
      ease: 'Sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    this.scene.tweens.add({
      targets: ghost,
      rotation: Math.PI * 2,
      duration: 3000,
      ease: 'Linear',
      repeat: -1,
    });

    this.scene.tweens.add({
      targets: ghost,
      alpha: { from: 0.6, to: 0.3 },
      duration: 800,
      ease: 'Sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    return ghost;
  }

  showRespawnPrompt(ghostSprite) {
    return new Promise((resolve) => {
      const centerX = this.scene.cameras.main.centerX;
      const centerY = this.scene.cameras.main.centerY;

      const overlay = this.scene.add
        .rectangle(centerX, centerY, 800, 600, 0x000000, 0.5)
        .setOrigin(0.5)
        .setDepth(10000)
        .setScrollFactor(0);

      const diedText = this.createDeathText(centerX, centerY);
      const descText = this.createDescriptionText(centerX, centerY);

      const confirmButton = this.createButton(centerX, centerY + 80, '확인', '#4CAF50', () => {
        this.destroyRespawnUI(overlay, diedText, descText, confirmButton);
        resolve(true);
      });
    });
  }

  createDeathText(centerX, centerY) {
    return this.scene.add
      .text(centerX, centerY - 100, 'YOU DIED', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10001)
      .setScrollFactor(0);
  }

  createDescriptionText(centerX, centerY) {
    return this.scene.add
      .text(centerX, centerY, '리스폰 하시겠습니까?', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10001)
      .setScrollFactor(0);
  }

  destroyRespawnUI(overlay, diedText, descText, confirmButton) {
    overlay.destroy();
    diedText.destroy();
    descText.destroy();
    confirmButton.bg.destroy();
    confirmButton.text.destroy();
  }

  createButton(x, y, text, color, callback) {
    const bg = this.scene.add
      .rectangle(x, y, 150, 50, color)
      .setOrigin(0.5)
      .setDepth(10001)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const btnText = this.scene.add
      .text(x, y, text, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10001)
      .setScrollFactor(0);

    bg.on('pointerdown', callback);
    bg.on('pointerover', () => {
      bg.setScale(1.1);
    });
    bg.on('pointerout', () => {
      bg.setScale(1);
    });

    return { bg, text: btnText };
  }

  async handleRespawn(ghostSprite) {
    await new Promise((resolve) => {
      this.scene.cameras.main.fade(800, 0, 0, 0, false, () => {
        resolve();
      });
    });

    if (ghostSprite) ghostSprite.destroy();

    // 리스폰 전 상태 초기화
    this.isDying = false;
    this.scene.isPlayerDead = false;

    if (this.stateMachine) {
      this.stateMachine.unlock();
    }

    // 보스 상태도 초기화
    this.scene.isBossSpawning = false;
    this.scene.currentBoss = null;

    // UI Scene도 재시작
    if (this.scene.scene.isActive('UIScene')) {
      this.scene.scene.restart('UIScene');
    }

    // 리스폰 플래그 추가
    this.scene.scene.restart({
      mapKey: this.scene.currentMapKey, // 현재 맵 유지
      characterType: this.characterType,
      isRespawn: true, // 🔑 리스폰 플래그
      respawnHealth: this.maxHealth,
    });
  }

  update() {
    const input = this.inputHandler.getInputState();
    this.movement.update();

    // 타이머가 없는데 무적 상태라면 강제 해제
    if (this.isInvincible && !this.invincibleTimer) {
      this.forceReleaseInvincibility();
    }

    // 사망 중일 때는 입력 무시
    if (this.isDying) {
      this.renderDebug();
      return;
    }

    // HP 0 체크 추가
    if (this.health <= 0 && !this.isDying) {
      this.onDeath();
      return;
    }

    if (this.isKnockedBack) {
      if (typeof this.onUpdate === 'function') {
        this.onUpdate(input);
      }
      this.renderDebug();
      return;
    }

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
  }

  updateMovement(input) {
    if (!this.stateMachine.isStateLocked()) {
      // 캐릭터 선택 오버레이 보일 때 이동 멈추기
      const isCharacterSelectVisible = this.scene.characterSelectOverlay?.isVisible || false;

      if (isCharacterSelectVisible) {
        // 속도를 0으로 설정
        if (this.sprite.body) {
          this.sprite.setVelocityX(0);
        }
        return;
      }

      this.movement.handleHorizontalMovement(input.cursors, input.isRunning);
    }
  }

  calculateDamage(baseDamage) {
    return Math.floor(baseDamage * this.strength);
  }

  // 방어력 적용된 받는 데미지 계산
  calculateDamageTaken(incomingDamage) {
    const reduction = Math.min(this.defense * 0.01, 0.8);
    const damage = Math.floor(incomingDamage * (1 - reduction));
    return Math.max(1, damage); // 최소 1 데미지
  }

  addStrength(amount) {
    this.strength += amount;
  }

  addDefense(amount) {
    this.defense += amount;
  }

  setStats(stats) {
    if (stats.strength !== undefined) this.strength = stats.strength;
    if (stats.defense !== undefined) this.defense = stats.defense;
    if (stats.maxHealth !== undefined) {
      this.maxHealth = stats.maxHealth;
      // 현재 체력이 새로운 최대값을 초과하지 않도록
      this.health = Math.min(this.health, this.maxHealth);
    }
    if (stats.maxMana !== undefined) {
      this.maxMana = stats.maxMana;
      // 현재 마나가 새로운 최대값을 초과하지 않도록
      this.mana = Math.min(this.mana, this.maxMana);
    }
  }

  getStats() {
    return {
      strength: this.strength,
      defense: this.defense,
      maxHealth: this.maxHealth,
      maxMana: this.maxMana,
    };
  }

  updateState(input) {
    if (this.stateMachine.isStateLocked()) {
      return;
    }

    const onGround = this.movement.isOnGround();
    const currentState = this.stateMachine.getCurrentState();

    // 캐릭터 선택 오버레이가 보이면 이동 차단
    const isCharacterSelectVisible = this.scene.characterSelectOverlay?.isVisible || false;

    if (isCharacterSelectVisible) {
      // UI가 보일 때는 idle 상태만 유지
      if (currentState !== 'idle') {
        this.stateMachine.changeState('idle');
      }
      return;
    }

    // 좌우 이동 키 직접 확인
    const isLeftDown = input.cursors.left.isDown;
    const isRightDown = input.cursors.right.isDown;
    const isHorizontalMoving = isLeftDown || isRightDown;

    // 공중 상태 확인
    if (!onGround) {
      const velocityY = this.sprite.body.velocity.y;

      if (velocityY < 0) {
        this.stateMachine.changeState('jump');
      } else {
        this.stateMachine.changeState('jump_down');
      }
    }
    // 지면에 있을 때만 walk/run/idle 상태 변환
    else {
      if (isHorizontalMoving) {
        // 현재 상태가 이미 walk/run이면 run 상태만 토글
        if (currentState === 'walk' || currentState === 'run') {
          const targetState = input.isRunning ? 'run' : 'walk';
          if (currentState !== targetState) {
            this.stateMachine.changeState(targetState);
          }
        } else {
          // idle이나 다른 상태에서 movement 시작
          const newState = input.isRunning ? 'run' : 'walk';
          this.stateMachine.changeState(newState);
        }
      } else {
        // 이동 키가 모두 해제됨 - idle로 변환
        if (currentState !== 'idle') {
          this.stateMachine.changeState('idle');
        }
      }
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

  showExpGainEffect(amount) {
    const expText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 50, `+${amount} EXP`, {
        fontSize: '16px',
        color: '#ffd43b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

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
    // 무적 타이머 정리
    if (this.invincibleTimer) {
      this.invincibleTimer.remove(false);
      this.invincibleTimer = null;
    }

    // 무적 트윈 정리
    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
      this.invincibilityTween = null;
    }
    if (this.inputHandler) this.inputHandler.destroy();
    if (this.stateMachine) this.stateMachine.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.attackSystem) this.attackSystem.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
  }

  get x() {
    return this.sprite ? this.sprite.x : 0;
  }

  get y() {
    return this.sprite ? this.sprite.y : 0;
  }
}
