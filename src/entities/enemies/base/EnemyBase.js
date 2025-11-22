import Phaser from 'phaser';
import { EnemiesData } from '../../../config/enemiesData.js';
import EnemyController from '../systems/EnemyController.js';
import EnemyAttackSystem from '../systems/EnemyAttackSystem.js';
import EnemySkillSystem from '../systems/EnemySkillSystem.js';
import BossController from '../systems/BossController.js';
import { KillTracker } from '../../../systems/KillTracker';
import SoulAbsorb from '../../../systems/SoulAbsorb.js';

export default class EnemyBase {
  constructor(scene, x, y, enemyType, direction = 1) {
    this.scene = scene;
    this.enemyType = enemyType;

    this.data = EnemiesData[enemyType];
    if (!this.data) {
      console.error(`❌ Enemy data not found: ${enemyType}`);
      this.sprite = scene.add.sprite(x, y, 'MISSING');
      return;
    }

    // === 스탯 설정 ===
    const stats = this.data.stats;
    this.maxHP = stats.maxHP;

    // 페이즈 시스템 (HP 계산 전에!)
    this.currentPhase = 1;
    this.maxPhase = this.data.ai?.maxPhase || 1;

    // 페이즈별 최대 체력 (직접 설정값 사용)
    const phaseMaxHPs = this.data.ai?.phaseMaxHPs || {};
    this.currentPhaseMaxHP = phaseMaxHPs[1] || this.maxHP / this.maxPhase;
    this.hp = this.currentPhaseMaxHP;

    this.phaseColors = {
      1: 0x00ff00, // 초록
      2: 0xffff00, // 노랑
      3: 0xff0000, // 빨강
    };

    this.speed = Phaser.Math.Between(stats.speed.min, stats.speed.max);
    this.runSpeed = stats.runSpeed || this.speed * 2;
    this.patrolRangeX = Phaser.Math.Between(stats.patrolRange.min, stats.patrolRange.max);
    this.expReward = stats.expReward;
    this.damageCooldown = stats.damageCooldown || 300;

    this.startX = x;
    this.isDead = false;
    this.lastDamageTime = 0;
    this.isBeingHit = false;
    this.direction = direction;
    this.isInvincible = false;

    // ✅ 보스/고정 플래그
    this.isBoss = this.data.ai?.type === 'boss';
    this.isStationary = enemyType === 'final_boss';

    const spriteKey = `${enemyType}_idle`;
    if (!scene.textures.exists(spriteKey)) {
      console.error(`Texture "${spriteKey}" not found.`);
      this.sprite = scene.add.sprite(x, y, '__MISSING');
      return;
    }

    this.sprite = scene.add.sprite(x, y, spriteKey);
    this.sprite.setScale(this.data.sprite.scale);

    // === 물리 설정 ===
    scene.physics.add.existing(this.sprite);
    const physics = this.data.physics;
    const spriteConfig = this.data.sprite;

    this.sprite.body.setSize(physics.width, physics.height);
    this.sprite.body.setCollideWorldBounds(physics.collideWorldBounds);

    let offsetX, offsetY;
    if (physics.offsetX !== undefined && physics.offsetY !== undefined) {
      offsetX = physics.offsetX;
      offsetY = physics.offsetY;
    } else {
      offsetX = (spriteConfig.frameWidth - physics.width) / 2;
      offsetY = (spriteConfig.frameHeight - physics.height) / 2;
    }
    this.sprite.body.setOffset(offsetX, offsetY);

    // ✅ final_boss는 상단 중앙에 고정
    if (this.isStationary) {
      const centerX = scene.physics.world.bounds.width / 2;
      const topY = 650;

      this.sprite.setPosition(centerX, topY);
      this.sprite.body.setImmovable(true);
      this.sprite.body.setAllowGravity(false);
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.moves = false;

      this.speed = 0;
      this.runSpeed = 0;
    } else {
      this.sprite.body.setVelocityX(this.speed * this.direction);
      const colliderTop = scene.physics.world.bounds.height - 200;
      const spriteY = colliderTop - physics.height * this.data.sprite.scale;
      this.sprite.y = spriteY;
    }

    // ✅ HP바 생성 (여기서만 호출!)
    this.createHPBar(physics);

    // 애니메이션 & AI
    this.createAnimations();
    this.sprite.play(`${enemyType}_idle`);
    this.initializeAI();
  }

  //  AI 시스템 초기화
  initializeAI() {
    const aiConfig = this.data.ai;

    if (!aiConfig) {
      console.error(`❌ No AI config for ${this.enemyType}`);
      return;
    }

    const attackRange = aiConfig.attack?.range || aiConfig.attack?.attackRange || 70;

    // 공격 시스템
    if (aiConfig.attack) {
      this.attackSystem = new EnemyAttackSystem(this, this.scene, {
        range: attackRange,
        damage: aiConfig.attack.damage || 10,
        cooldown: aiConfig.attack.cooldown || 1500,
        hitDelay: aiConfig.attack.hitDelay || 200,
        animationKey: `${this.enemyType}_attack`,
      });
    }

    // 스킬 시스템
    if (aiConfig.skills) {
      const hasSkills = Array.isArray(aiConfig.skills)
        ? aiConfig.skills.length > 0
        : Object.keys(aiConfig.skills).length > 0;

      if (hasSkills) {
        this.skillSystem = new EnemySkillSystem(this, this.scene, aiConfig.skills);
      }
    }

    // ✅ 수정: 컨트롤러 - BossController에 페이즈 설정 추가
    if (aiConfig.type === 'boss') {
      this.controller = new BossController(this, {
        attackRange: attackRange,
        detectRange: aiConfig.detectRange || 300,
        attackCooldown: aiConfig.attack?.cooldown || 1500,
        skillCooldown: aiConfig.skillCooldown || 3000,
        skills: aiConfig.skillNames || [],
        walkRange: aiConfig.attack?.walkRange || 1200,
        runRange: aiConfig.attack?.runRange || 500,
        // ✅ 새로 추가
        maxPhase: aiConfig.maxPhase || 1,
        phaseThresholds: aiConfig.phaseThresholds || [0.5],
      });
    } else if (aiConfig.type === 'aggressive' || aiConfig.type === 'patrol') {
      this.controller = new EnemyController(this, {
        attackRange: attackRange,
        detectRange: aiConfig.detectRange || 200,
        attackCooldown: aiConfig.attack?.cooldown || 1500,
      });
    } else {
      console.warn(`⚠️ Unknown AI type: ${aiConfig.type}`);
    }
  }

  createHPBar(physics) {
    const scene = this.scene;

    if (this.isBoss) {
      const camera = scene.cameras.main;
      const barWidth = 500;
      const barHeight = 16;
      const barY = 110;
      const centerX = camera.width / 2;

      const bossDisplayName =
        this.data.displayName || this.enemyType.toUpperCase().replace(/_/g, ' ');

      // HP바 배경 (검은색)
      this.hpBarBg = scene.add
        .rectangle(centerX, barY, barWidth + 6, barHeight + 6, 0x000000)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(-1);

      // HP바 테두리
      this.hpBarBorder = scene.add
        .rectangle(centerX, barY, barWidth + 2, barHeight + 2, 0x333333)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(-1);

      // ✅ HP바 본체 (페이즈 1의 색상으로 시작)
      this.hpBar = scene.add
        .rectangle(centerX, barY, barWidth, barHeight, this.phaseColors[1])
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(10000);

      this.hpBarMaxWidth = barWidth;

      // 보스 이름
      this.bossNameText = scene.add
        .text(centerX, barY - 22, bossDisplayName, {
          fontSize: '18px',
          fontFamily: 'Arial Black',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(10000);

      // 페이즈 텍스트 (오른쪽)
      this.phaseText = scene.add
        .text(centerX, barY, `PHASE ${this.currentPhase}`, {
          fontSize: '14px',
          fontFamily: 'Arial Black',
          color: '#00ff00',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(10000);

      // HP 텍스트 (바 위에) - 현재 페이즈 기준으로 표시
      this.hpText = scene.add
        .text(centerX, barY, `${Math.ceil(this.hp)} / ${Math.ceil(this.currentPhaseMaxHP)}`, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(-1);
    } else {
      // ✅ 일반 적만 머리 위에 HP바 생성
      const hpBarWidth = physics.width;
      this.hpBar = scene.add
        .rectangle(this.sprite.x, this.sprite.y - physics.height / 2 - 10, hpBarWidth, 5, 0x00ff00)
        .setOrigin(0.5, 0.5);
      this.hpBarMaxWidth = hpBarWidth;
    }
  }

  onPhaseChange(newPhase) {
    console.log(`🔄 ${this.enemyType} Phase changed to ${newPhase}`);

    this.currentPhase = newPhase;

    // 페이즈별 최대 체력 (직접 설정값 사용)
    const phaseMaxHPs = this.data.ai?.phaseMaxHPs || {};
    this.currentPhaseMaxHP = phaseMaxHPs[newPhase] || this.maxHP / this.maxPhase;
    this.hp = this.currentPhaseMaxHP;

    // HP바 색상 변경
    const newColor = this.phaseColors[newPhase] || 0xff0000;
    this.hpBar.setFillStyle(newColor);
    this.hpBar.width = this.hpBarMaxWidth; // 풀피로 리셋

    // HP 텍스트 업데이트
    if (this.hpText) {
      this.hpText.setText(`${Math.ceil(this.hp)} / ${Math.ceil(this.currentPhaseMaxHP)}`);
    }

    // 페이즈 텍스트 업데이트
    if (this.phaseText) {
      this.phaseText.setText(`PHASE ${newPhase}`);

      // 페이즈 텍스트 색상도 변경
      const textColors = {
        1: '#00ff00',
        2: '#ffff00',
        3: '#ff0000',
      };
      this.phaseText.setColor(textColors[newPhase] || '#ff0000');
    }

    // 죽음 상태 해제
    this.isDead = false;
    this.isInvincible = false;
  }

  // 애니메이션 생성 (EnemiesData.animations 기반)
  createAnimations() {
    if (!this.data || !this.data.animations) return;

    Object.entries(this.data.animations).forEach(([key, anim]) => {
      const animKey = `${this.enemyType}_${key}`;

      if (!this.scene.anims.exists(animKey)) {
        if (this.scene.textures.exists(animKey)) {
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(animKey, {
              start: anim.start,
              end: anim.end,
            }),
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          });
        } else {
          console.warn(`⚠️ Texture "${animKey}" not found for animation. Skipping.`);
        }
      }
    });
  }

  /**
   * 정적 메서드: 에셋 로드 (EnemiesData.assets 기반)
   */
  static preload(scene, enemyType) {
    const data = EnemiesData[enemyType];
    if (!data) {
      console.error(`❌ Enemy data not found: ${enemyType}`);
      return;
    }

    const { frameWidth, frameHeight } = data.sprite;
    const assets = data.assets;

    // 모든 assets 키(idle, hit, death, attack 등)를 순회하며 로드
    Object.entries(assets).forEach(([key, path]) => {
      scene.load.spritesheet(`${enemyType}_${key}`, path, { frameWidth, frameHeight });
    });

    scene.load.once('complete', () => {});

    // 로드 에러
    scene.load.on('loaderror', (file) => {
      console.error(`❌ Load error: ${file.key} from ${file.url}`);
    });
  }

  /**
   * 매 프레임 업데이트
   */
  update(time, delta) {
    if (!this.sprite || this.isDead) return;

    if (this.isStationary) {
      this.sprite.body.setVelocity(0, 0);
    }

    if (this.controller) {
      this.controller.update(time, delta);
    }

    if (this.skillSystem) {
      this.skillSystem.update(delta);
    }

    // 방향 flip
    if (!this.isLockingDirection) {
      if (this.isStationary && this.scene.player?.sprite) {
        const playerX = this.scene.player.sprite.x;
        this.direction = playerX > this.sprite.x ? 1 : -1;
      }

      const baseFlip = this.data.sprite.flipX || false;
      this.sprite.setFlipX(this.direction > 0 ? !baseFlip : baseFlip);
    }

    // ✅ HP바 위치 (보스는 화면 고정이라 업데이트 불필요)
    if (!this.isBoss) {
      this.hpBar.x = this.sprite.x;
      this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 10;
    }
  }

  // 타겟을 향해 이동 (AI Controller가 호출)
  moveToward(target) {
    // 고정 보스는 이동 안 함
    if (this.isStationary) return;

    if (this.isDead || !this.sprite.body) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    this.sprite.body.setVelocityX(Math.cos(angle) * this.speed);
    this.direction = Math.cos(angle) > 0 ? 1 : -1;
  }

  /**
   * 공격 애니메이션 재생 후 콜백 (레거시 - 사용 안 함)
   */
  playAttackAnimation(callback) {
    const attackKey = `${this.enemyType}_attack`;

    if (this.scene.anims.exists(attackKey)) {
      this.sprite.play(attackKey, true);
      this.sprite.once(`animationcomplete-${attackKey}`, () => {
        if (callback) callback();
        if (!this.isDead) this.sprite.play(`${this.enemyType}_idle`);
      });
    } else {
      if (callback) callback();
    }
  }

  /**
   * 기본 공격 수행 (레거시 - 사용 안 함)
   */
  performBasicAttack(target) {
    if (this.attackSystem) {
      this.attackSystem.attack(target);
    }
  }

  /**
   * 스킬 시전 (AI Controller가 호출)
   */
  castSkill(skillName) {
    // 피격 중이면 스킬 사용 불가
    if (this.isBeingHit) {
      return;
    }

    if (!this.skillSystem) return;

    const player = this.scene.player;
    if (!player) return;

    if (skillName) {
      const skill = this.skillSystem.skills.find((s) => s.name === skillName);
      if (skill && skill._canUse) {
        this.skillSystem._activateSkill(skill, player);
      }
    } else {
      this.skillSystem.useSkill(player);
    }
  }

  /**
   * 데미지 처리
   */

  takeDamage(amount = 1) {
    if (this.isDead) return false;
    if (this.isInvincible) return false;

    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDamageTime < this.damageCooldown) {
      return false;
    }
    this.lastDamageTime = currentTime;

    this.hp -= amount;

    // ✅ 현재 페이즈 기준 HP 퍼센트 (0 ~ 1 사이의 값)
    const hpPercent = Math.max(0, Math.min(1, this.hp / this.currentPhaseMaxHP));

    console.log(
      `💥 ${this.enemyType} took ${amount} damage. HP: ${Math.ceil(this.hp)} / ${Math.ceil(
        this.currentPhaseMaxHP,
      )} (${(hpPercent * 100).toFixed(1)}%)`,
    );

    // HP바 너비 업데이트 (0 ~ maxWidth 사이)
    this.hpBar.width = this.hpBarMaxWidth * hpPercent;

    // ✅ 보스는 페이즈 색상 유지 (HP%에 따라 색 안 바뀜)
    if (!this.isBoss) {
      // 일반 적만 HP%에 따라 색상 변경
      if (hpPercent > 0.6) {
        this.hpBar.setFillStyle(0x00ff00);
      } else if (hpPercent > 0.3) {
        this.hpBar.setFillStyle(0xffff00);
      } else {
        this.hpBar.setFillStyle(0xff0000);
      }
    }

    // HP 텍스트 업데이트
    if (this.hpText) {
      this.hpText.setText(
        `${Math.ceil(Math.max(0, this.hp))} / ${Math.ceil(this.currentPhaseMaxHP)}`,
      );
    }

    // ✅ 페이즈 클리어 체크
    if (this.hp <= 0) {
      // 보스인 경우, 현재 페이즈가 마지막 페이즈가 아닌지 확인
      if (this.isBoss && this.currentPhase < this.maxPhase) {
        console.log(
          `⚡ Phase ${this.currentPhase} cleared! Moving to Phase ${this.currentPhase + 1}`,
        );
        this.onPhaseChange(this.currentPhase + 1);
        return false; // 아직 살아있음 (다음 페이즈로 진행)
      }

      // 최종 페이즈 클리어 또는 일반 적 → 완전히 죽음
      this.isDead = true;
      if (this.sprite.body) this.sprite.body.setVelocity(0);

      // ✅ 보스 HP바는 죽을 때 숨김
      if (this.isBoss) {
        this.hpBar.visible = false;
        if (this.hpBarBg) this.hpBarBg.visible = false;
        if (this.hpBarBorder) this.hpBarBorder.visible = false;
        if (this.bossNameText) this.bossNameText.visible = false;
        if (this.hpText) this.hpText.visible = false;
        if (this.phaseText) this.phaseText.visible = false;
      } else {
        this.hpBar.visible = false;
      }

      this.playDeath();
      return true; // 죽음
    } else {
      this.playHit();
      return false;
    }
  }

  playHit() {
    const hitKey = `${this.enemyType}_hit`;
    const idleKey = `${this.enemyType}_idle`;

    // 피격 상태 시작
    this.isBeingHit = true;

    // 이동 정지
    if (this.sprite.body) {
      this.sprite.body.setVelocity(0);
    }

    if (this.scene.anims.exists(hitKey)) {
      this.sprite.play(hitKey);
      this.sprite.once(`animationcomplete-${hitKey}`, () => {
        // 피격 상태 종료
        this.isBeingHit = false;

        if (!this.isDead) this.sprite.play(idleKey);
      });
    } else {
      // 피격 애니메이션이 없으면 짧은 딜레이 후 해제
      this.scene.time.delayedCall(200, () => {
        this.isBeingHit = false;
      });
    }
  }

  playDeath() {
    console.log(`🎬 ${this.enemyType} playing death animation`);

    // ✅ semi_boss는 클리어 메시지 없이 바로 처리
    if (this.enemyType === 'semi_boss') {
      console.log('🔄 Semi_boss death - special handling');

      const deathKey = `${this.enemyType}_death`;

      if (this.scene.anims.exists(deathKey)) {
        this.sprite.play(deathKey);
        this.sprite.once(`animationcomplete-${deathKey}`, () => {
          console.log('✨ Semi_boss death animation complete');
          this.handleSemiBossDeath();
        });
      } else {
        this.handleSemiBossDeath();
      }
      return;
    }

    // 일반 적/보스는 기존 로직
    const deathKey = `${this.enemyType}_death`;

    if (this.scene.anims.exists(deathKey)) {
      this.sprite.play(deathKey);
      this.sprite.once(`animationcomplete-${deathKey}`, () => {
        console.log(`✨ ${this.enemyType} death animation complete - spawning soul`);
        this.spawnSoul();
      });
    } else {
      console.warn(`⚠️ Death animation not found: ${deathKey}`);
      this.spawnSoul();
    }
  }

  handleSemiBossDeath() {
    console.log('👻 Semi_boss handleSemiBossDeath called');

    // 경험치 지급
    if (this.expReward > 0 && !this.hasGrantedExp) {
      this.hasGrantedExp = true;

      const currentMapKey = this.scene.currentMapKey;
      if (currentMapKey) {
        KillTracker.recordKill(currentMapKey, this.enemyType);
      }

      if (this.scene?.onExpGained) {
        const characterType = this.scene.selectedCharacter || 'soul';
        this.scene.onExpGained(this.expReward, characterType);
      }
    }

    // 스프라이트 정리
    if (this.sprite) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
    if (this.skillSystem) this.skillSystem.destroy();

    // 현재 보스 참조 제거
    if (this.scene.currentBoss === this) {
      this.scene.currentBoss = null;
    }

    // ✅ final_map으로 이동 (클리어 메시지 없이!)
    console.log('🚪 Transitioning to final_map...');
    this.scene.transitionToFinalMapAfterSemiBoss();
  }

  spawnSoul() {
    console.log(`👻 ${this.enemyType} spawning soul...`);
    const player = this.scene.player;

    if (player && this.scene.soulAbsorb) {
      this.scene.soulAbsorb.spawnAndAbsorb(this.sprite.x, this.sprite.y, player, () => {
        console.log(`🌟 Soul absorbed - calling destroy()`);
        this.destroy();
      });
    } else {
      console.log(`❌ No player or soulAbsorb - calling destroy directly`);
      this.destroy();
    }
  }

  destroy() {
    console.log(`🗑️ ${this.enemyType}.destroy() called`);
    console.log('isDead:', this.isDead);
    console.log('scene exists:', !!this.scene);

    // ✅ semi_boss 특별 처리
    if (this.enemyType === 'semi_boss' && this.isDead) {
      console.log('🔄 Semi_boss destroy - START');
      console.log(
        'scene.transitionToFinalMapAfterSemiBoss exists:',
        typeof this.scene?.transitionToFinalMapAfterSemiBoss,
      );

      // 경험치 지급
      if (this.expReward > 0 && !this.hasGrantedExp) {
        this.hasGrantedExp = true;

        const currentMapKey = this.scene.currentMapKey;
        if (currentMapKey) {
          KillTracker.recordKill(currentMapKey, this.enemyType);
        }

        if (this.scene?.onExpGained) {
          const characterType = this.scene.selectedCharacter || 'soul';
          this.scene.onExpGained(this.expReward, characterType);
        }
      }

      // 스프라이트 정리
      if (this.sprite) this.sprite.destroy();
      if (this.hpBar) this.hpBar.destroy();
      if (this.skillSystem) this.skillSystem.destroy();

      // 현재 보스 참조 제거
      if (this.scene.currentBoss === this) {
        this.scene.currentBoss = null;
      }

      // ✅ final_map으로 이동
      console.log('🚪 Calling transitionToFinalMapAfterSemiBoss...');

      if (this.scene && this.scene.transitionToFinalMapAfterSemiBoss) {
        this.scene
          .transitionToFinalMapAfterSemiBoss()
          .then(() => {
            console.log('✅ Transition complete');
          })
          .catch((err) => {
            console.error('❌ Transition error:', err);
          });
      } else {
        console.error('❌ transitionToFinalMapAfterSemiBoss not found!');
        console.log('Available scene methods:', Object.keys(this.scene || {}));
      }

      return;
    }

    // 일반 적/보스 처리 (기존 코드)
    if (this.isDead && this.expReward > 0 && !this.hasGrantedExp) {
      this.hasGrantedExp = true;

      const currentMapKey = this.scene.currentMapKey;
      if (currentMapKey) {
        KillTracker.recordKill(currentMapKey, this.enemyType);
      }

      if (this.scene?.onExpGained) {
        const characterType = this.scene.selectedCharacter || 'soul';
        this.scene.onExpGained(this.expReward, characterType);

        if (this.scene.player?.showExpGainEffect) {
          this.scene.player.showExpGainEffect(this.expReward);
        }
      }
    }

    if (this.sprite) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarBorder) this.hpBarBorder.destroy();
    if (this.bossNameText) this.bossNameText.destroy();
    if (this.hpText) this.hpText.destroy();
    if (this.phaseText) this.phaseText.destroy();
    if (this.skillSystem) this.skillSystem.destroy();
  }

  get x() {
    return this.sprite ? this.sprite.x : 0;
  }

  get y() {
    return this.sprite ? this.sprite.y : 0;
  }

  play(animKey, ignoreIfPlaying) {
    if (this.sprite) {
      this.sprite.play(animKey, ignoreIfPlaying);
    }
  }
}
