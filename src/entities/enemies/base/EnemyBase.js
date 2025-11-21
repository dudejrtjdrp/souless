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

    // 1. EnemiesData에서 해당 몬스터의 모든 설정 데이터를 가져옵니다.
    this.data = EnemiesData[enemyType];
    if (!this.data) {
      console.error(`❌ Enemy data not found: ${enemyType}`);
      this.sprite = scene.add.sprite(x, y, 'MISSING');
      return;
    }

    // === 스탯 설정 === (EnemiesData.stats 기반)
    const stats = this.data.stats;
    this.maxHP = stats.maxHP;
    this.hp = this.maxHP;
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

    const spriteKey = `${enemyType}_idle`;
    if (!scene.textures.exists(spriteKey)) {
      console.error(`Texture "${spriteKey}" not found. Did you preload it?`);
      this.sprite = scene.add.sprite(x, y, '__MISSING');
      return;
    }

    this.sprite = scene.add.sprite(x, y, spriteKey);
    this.sprite.setScale(this.data.sprite.scale);

    // === 물리 설정 === (EnemiesData.physics 기반)
    scene.physics.add.existing(this.sprite);
    const physics = this.data.physics;
    const spriteConfig = this.data.sprite;

    this.sprite.body.setSize(physics.width, physics.height);
    this.sprite.body.setCollideWorldBounds(physics.collideWorldBounds);
    this.sprite.body.setVelocityX(this.speed * this.direction);

    let offsetX, offsetY;

    // 커스텀 오프셋이 지정되어 있으면 사용
    if (physics.offsetX !== undefined && physics.offsetY !== undefined) {
      offsetX = physics.offsetX;
      offsetY = physics.offsetY;
    } else {
      // 자동 계산: 중앙 정렬
      offsetX = (spriteConfig.frameWidth - physics.width) / 2;
      offsetY = (spriteConfig.frameHeight - physics.height) / 2;
    }

    this.sprite.body.setOffset(offsetX, offsetY);

    this.sprite.body.setVelocityX(this.speed * this.direction);
    const colliderTop = scene.physics.world.bounds.height - 200;
    const spriteY = colliderTop - physics.height * this.data.sprite.scale;

    this.sprite.y = spriteY;
    // === HP바 ===
    const hpBarWidth = physics.width;
    this.hpBar = scene.add.rectangle(x, y - physics.height / 2 - 10, hpBarWidth, 5, 0x00ff00);
    this.hpBar.setOrigin(0.5, 0.5);
    this.hpBarMaxWidth = hpBarWidth;

    // === 애니메이션 생성 === (EnemiesData.animations 기반)
    this.createAnimations();
    this.sprite.play(`${enemyType}_idle`);

    // === AI 시스템 초기화 === (EnemiesData.ai 기반)
    this.initializeAI();
  }

  /**
   * AI 시스템 초기화
   */
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

    // 스킬 시스템 (배열 또는 객체 모두 지원)
    if (aiConfig.skills) {
      // 배열인지 객체인지 확인
      const hasSkills = Array.isArray(aiConfig.skills)
        ? aiConfig.skills.length > 0
        : Object.keys(aiConfig.skills).length > 0;

      if (hasSkills) {
        this.skillSystem = new EnemySkillSystem(this, this.scene, aiConfig.skills);
      }
    }

    // 컨트롤러
    if (aiConfig.type === 'boss') {
      this.controller = new BossController(this, {
        attackRange: attackRange,
        detectRange: aiConfig.detectRange || 300,
        attackCooldown: aiConfig.attack?.cooldown || 1500,
        skillCooldown: aiConfig.skillCooldown || 3000,
        skills: aiConfig.skillNames || [],
        walkRange: aiConfig.attack?.walkRange || 1200,
        runRange: aiConfig.attack?.runRange || 500,
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

  /**
   * 애니메이션 생성 (EnemiesData.animations 기반)
   */
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

    // AI 컨트롤러 업데이트
    if (this.controller) {
      this.controller.update(time, delta);
    } else {
      console.warn(`⚠️ ${this.enemyType}: No controller! Using fallback patrol.`);

      // 기본 Patrol AI (컨트롤러가 없는 경우)
      if (this.data.ai?.type === 'patrol') {
        if (this.sprite.x >= this.startX + this.patrolRangeX) {
          this.direction = -1;
        } else if (this.sprite.x <= this.startX - this.patrolRangeX) {
          this.direction = 1;
        }
        this.sprite.body.setVelocityX(this.speed * this.direction);
      }
    }

    // 스킬 시스템 업데이트
    if (this.skillSystem) {
      this.skillSystem.update(delta);
    }

    // === 방향 flip (스킬 사용 중이 아닐 때만) ===
    if (!this.isLockingDirection) {
      const baseFlip = this.data.sprite.flipX || false;
      this.sprite.setFlipX(this.direction > 0 ? !baseFlip : baseFlip);
    }

    // === HP바 위치 ===
    this.hpBar.x = this.sprite.x;
    this.hpBar.y = this.sprite.y - this.sprite.height / 2 - 10;
  }

  /**
   * 타겟을 향해 이동 (AI Controller가 호출)
   */
  moveToward(target) {
    if (this.isDead || !this.sprite.body) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    this.sprite.body.setVelocityX(Math.cos(angle) * this.speed);
    // Y축 이동이 필요하다면 활성화 (Top-down 뷰)
    // this.sprite.body.setVelocityY(Math.sin(angle) * this.speed);

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

    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDamageTime < this.damageCooldown) return false;
    this.lastDamageTime = currentTime;

    this.hp -= amount;

    // HP바 업데이트
    const hpPercent = Math.max(0, this.hp / this.maxHP);
    this.hpBar.width = this.hpBarMaxWidth * hpPercent;

    if (hpPercent > 0.6) {
      this.hpBar.setFillStyle(0x00ff00);
    } else if (hpPercent > 0.3) {
      this.hpBar.setFillStyle(0xffff00);
    } else {
      this.hpBar.setFillStyle(0xff0000);
    }

    // 죽음 여부 확인
    if (this.hp <= 0) {
      this.isDead = true;
      if (this.sprite.body) this.sprite.body.setVelocity(0);
      this.hpBar.visible = false;

      this.playDeath();
      return true;
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
    const deathKey = `${this.enemyType}_death`;

    if (this.scene.anims.exists(deathKey)) {
      this.sprite.play(deathKey);
      this.sprite.once(`animationcomplete-${deathKey}`, () => {
        this.spawnSoul(); // 영혼 생성
      });
    } else {
      this.spawnSoul(); // 영혼 생성
    }
  }

  spawnSoul() {
    const player = this.scene.player;

    if (player && this.scene.soulAbsorb) {
      // 적 위치에서 영혼 생성 → 플레이어에게 흡수
      this.scene.soulAbsorb.spawnAndAbsorb(this.sprite.x, this.sprite.y, player, () => {
        // 흡수 완료 후 실행할 콜백 (선택사항)
        // 예: 플레이어 이펙트, 사운드 등
        this.destroy();
      });
    } else {
      this.destroy();
    }
  }

  destroy() {
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
