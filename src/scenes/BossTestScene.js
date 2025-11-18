import Phaser from 'phaser';
import EnemyBase from '../entities/enemies/base/EnemyBase.js';
import CharacterFactory from '../entities/characters/base/CharacterFactory.js';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import { EffectLoader } from '../systems/Effects/EffectLoader.js';
import { EffectManager } from '../systems/Effects/EffectManager.js';
import InputHandler from '../entities/characters/systems/InputHandler.js';
import CombatCollisionHandler from '../systems/GameScene/CombatCollisionHandler.js';
import BossController from '../entities/enemies/systems/BossController.js';

export default class BossTestScene extends Phaser.Scene {
  constructor() {
    super('BossTestScene');
  }

  init(data = {}) {
    // 테스트할 보스 타입 (기본값: assassin_boss)
    this.bossType = 'assassin_boss';
    // 플레이어 캐릭터 타입 (기본값: soul)
    this.selectedCharacter = data.characterType || 'soul';
  }

  preload() {
    // 캐릭터 에셋 로드
    CharacterAssetLoader.preload(this);

    // 보스 에셋 로드
    EnemyBase.preload(this, this.bossType);

    // 이펙트 로드
    this.effectManager = new EffectManager(this);
    EffectLoader.preloadAllEffects(this);

    // 간단한 배경 (선택사항)
    this.load.image('test_bg', 'assets/backgrounds/test_background.png'); // 실제 경로로 변경
  }

  create() {
    this.setupScene();
    this.createBackground();
    this.createPlatform();
    this.setupPlayer();
    this.setupBoss();
    this.setupCamera();
    this.setupInputHandler();
    this.createUI();

    EffectLoader.createAllAnimations(this);
    console.log(this);
  }

  setupScene() {
    // 페이드인 효과
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 중력 설정
    this.physics.world.gravity.y = 1500;

    // 월드 바운드 설정
    this.physics.world.setBounds(0, 0, 1920, 1080);
  }

  createBackground() {
    // 배경색 설정
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 배경 이미지 (있는 경우)
    if (this.textures.exists('test_bg')) {
      const bg = this.add.image(960, 540, 'test_bg');
      bg.setScrollFactor(0.5);
      bg.setDepth(-100);
    }

    // 그리드 표시 (디버깅용)
    this.createGrid();
  }

  createGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.3);

    // 가로선
    for (let y = 0; y <= 1080; y += 100) {
      graphics.lineBetween(0, y, 1920, y);
    }

    // 세로선
    for (let x = 0; x <= 1920; x += 100) {
      graphics.lineBetween(x, 0, x, 1080);
    }

    graphics.setDepth(-99);
  }

  createPlatform() {
    // 바닥 플랫폼 생성
    this.platforms = this.physics.add.staticGroup();

    // 메인 바닥
    const ground = this.add.rectangle(960, 900, 1920, 100, 0x333333);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    // 추가 플랫폼 (선택사항)
    const platform1 = this.add.rectangle(400, 700, 300, 30, 0x444444);
    this.physics.add.existing(platform1, true);
    this.platforms.add(platform1);

    const platform2 = this.add.rectangle(1520, 700, 300, 30, 0x444444);
    this.physics.add.existing(platform2, true);
    this.platforms.add(platform2);

    const platform3 = this.add.rectangle(960, 500, 400, 30, 0x444444);
    this.physics.add.existing(platform3, true);
    this.platforms.add(platform3);
  }

  setupPlayer() {
    // 플레이어 생성 (왼쪽에서 시작)
    this.player = CharacterFactory.create(this, this.selectedCharacter, 300, 800, {
      scale: 2,
    });

    this.player.sprite.setDepth(10);

    // 플레이어와 플랫폼 충돌 설정
    this.physics.add.collider(this.player.sprite, this.platforms);

    // 월드 바운드 충돌 (body를 통해 설정)
    if (this.player.sprite.body) {
      this.player.sprite.body.setCollideWorldBounds(true);
    }
  }

  setupBoss() {
    // 보스 생성 (오른쪽에서 시작)
    this.boss = new EnemyBase(this, 1600, 700, this.bossType, -1);

    if (!this.boss || !this.boss.sprite) {
      console.error('❌ Failed to create boss!');
      return;
    }

    this.boss.sprite.setDepth(10);

    // 보스와 플랫폼 충돌 설정
    this.physics.add.collider(this.boss.sprite, this.platforms);

    // 월드 바운드 충돌 (body를 통해 설정)
    if (this.boss.sprite.body) {
      this.boss.sprite.body.setCollideWorldBounds(true);
    }

    // 보스의 자체 HP바 숨기기 (테스트 씬에서는 화면 상단에 큰 HP바 사용)
    if (this.boss.hpBar) {
      this.boss.hpBar.setVisible(false);
    }

    const aiConfig = this.boss.data?.ai || {};

    // BossController 인스턴스 생성
    this.boss.controller = new BossController(this.boss, {
      attackRange: aiConfig.attackRange || 70,
      detectRange: aiConfig.detectRange || 200,
      attackCooldown: aiConfig.attackCooldown || 1500,
      skillCooldown: aiConfig.skillCooldown || 3000,
      skills: aiConfig.skills || [], // 스킬 목록
    });

    // 타겟 설정
    this.boss.controller.target = this.player;
  }

  setupCamera() {
    const camera = this.cameras.main;

    // 플레이어 추적 (부드럽게)
    camera.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 카메라 바운드 설정
    camera.setBounds(0, 0, 1920, 1080);

    // 줌 설정 (선택사항)
    // camera.setZoom(0.8);
  }

  setupInputHandler() {
    this.inputHandler = new InputHandler(this);

    // Tab 키 기본 동작 방지
    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
    });
  }

  createUI() {
    // === 상단 정보 표시 ===
    const infoText = [
      `Boss: ${this.bossType}`,
      `Player: ${this.selectedCharacter}`,
      '',
      'Controls:',
      'Arrow Keys: Move',
      'Z: Attack',
      'X: Skill',
      'R: Reset Scene',
      'B: Change Boss',
      'C: Change Character',
    ].join('\n');

    this.infoLabel = this.add.text(10, 10, infoText, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 8 },
      fontFamily: 'monospace',
    });
    this.infoLabel.setScrollFactor(0);
    this.infoLabel.setDepth(1000);

    // === 보스 HP 바 (화면 상단 중앙) ===
    this.createBossHPBar();

    // === 플레이어 HP/스태미나 바 (화면 하단 왼쪽) ===
    this.createPlayerStatusBar();
  }

  createBossHPBar() {
    const barWidth = 500;
    const barHeight = 30;
    const x = 960 - barWidth / 2;
    const y = 50;

    // 배경
    this.bossHPBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
    this.bossHPBg.setOrigin(0, 0);
    this.bossHPBg.setScrollFactor(0);
    this.bossHPBg.setDepth(999);

    // HP 바
    this.bossHPBar = this.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0xff0000);
    this.bossHPBar.setOrigin(0, 0);
    this.bossHPBar.setScrollFactor(0);
    this.bossHPBar.setDepth(1000);

    // 텍스트
    this.bossHPText = this.add.text(960, y + barHeight / 2, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.bossHPText.setOrigin(0.5, 0.5);
    this.bossHPText.setScrollFactor(0);
    this.bossHPText.setDepth(1001);

    // 보스 이름
    this.bossNameText = this.add.text(960, y - 20, `BOSS: ${this.bossType.toUpperCase()}`, {
      fontSize: '18px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.bossNameText.setOrigin(0.5, 0.5);
    this.bossNameText.setScrollFactor(0);
    this.bossNameText.setDepth(1001);
  }

  createPlayerStatusBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 1000;

    // HP 배경
    this.playerHPBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
    this.playerHPBg.setOrigin(0, 0);
    this.playerHPBg.setScrollFactor(0);
    this.playerHPBg.setDepth(999);

    // HP 바
    this.playerHPBar = this.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0x00ff00);
    this.playerHPBar.setOrigin(0, 0);
    this.playerHPBar.setScrollFactor(0);
    this.playerHPBar.setDepth(1000);

    // HP 텍스트
    this.playerHPText = this.add.text(x + barWidth / 2, y + barHeight / 2, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.playerHPText.setOrigin(0.5, 0.5);
    this.playerHPText.setScrollFactor(0);
    this.playerHPText.setDepth(1001);
  }

  updateBossHPBar(time, delta) {
    if (!this.boss || this.boss.isDead) {
      this.bossHPBar.width = 0;
      this.bossHPText.setText('DEFEATED');
      return;
    }
    if (this.boss && this.boss.controller) {
      this.boss.controller.update(time, delta);
    }
    const percent = Math.max(0, this.boss.hp / this.boss.maxHP);
    const maxWidth = 496; // barWidth - 4
    this.bossHPBar.width = maxWidth * percent;

    this.bossHPText.setText(`${Math.ceil(this.boss.hp)} / ${this.boss.maxHP}`);

    // HP에 따라 색상 변경
    if (percent > 0.6) {
      this.bossHPBar.setFillStyle(0xff0000);
    } else if (percent > 0.3) {
      this.bossHPBar.setFillStyle(0xff8800);
    } else {
      this.bossHPBar.setFillStyle(0xffdd00);
    }
  }

  updatePlayerStatusBar() {
    if (!this.player) return;

    const hp = this.player.stats?.hp || 100;
    const maxHP = this.player.stats?.maxHP || 100;
    const percent = Math.max(0, hp / maxHP);
    const maxWidth = 196; // barWidth - 4

    this.playerHPBar.width = maxWidth * percent;
    this.playerHPText.setText(`${Math.ceil(hp)} / ${maxHP}`);

    // HP에 따라 색상 변경
    if (percent > 0.6) {
      this.playerHPBar.setFillStyle(0x00ff00);
    } else if (percent > 0.3) {
      this.playerHPBar.setFillStyle(0xffff00);
    } else {
      this.playerHPBar.setFillStyle(0xff0000);
    }
  }

  update(time, delta) {
    if (!this.player?.sprite?.active) return;

    // 플레이어 업데이트
    this.player.update();

    // 보스 업데이트
    if (this.boss && !this.boss.isDead) {
      // 보스가 제대로 초기화되었는지 확인
      if (this.boss.sprite && this.boss.sprite.body) {
        this.boss.update(time, delta);
      }
    }

    // 전투 충돌 체크
    if (this.boss && !this.boss.isDead) {
      const handler = new CombatCollisionHandler(this);
      handler.checkAttackCollisions();
    }

    // 이펙트 업데이트
    this.effectManager?.update();

    // UI 업데이트
    this.updateBossHPBar(time, delta);
    this.updatePlayerStatusBar();

    // 입력 처리
    this.handleInput();
  }

  handleInput() {
    const input = this.inputHandler.getInputState();

    // R: 씬 재시작
    if (input.isRPressed) {
      this.restartScene();
    }

    // B: 보스 타입 변경
    if (input.isBPressed) {
      this.changeBoss();
    }

    // C: 캐릭터 변경
    if (input.isCPressed) {
      this.changeCharacter();
    }
  }

  restartScene() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.restart({
        bossType: this.bossType,
        characterType: this.selectedCharacter,
      });
    });
  }

  changeBoss() {
    // 보스 타입 목록 (실제 사용 가능한 보스로 수정)
    const bosses = ['assassin_boss']; // 추가 보스가 있다면 여기에 추가

    const currentIndex = bosses.indexOf(this.bossType);
    const nextIndex = (currentIndex + 1) % bosses.length;
    this.bossType = bosses[nextIndex];

    this.restartScene();
  }

  changeCharacter() {
    const characters = ['soul', 'skull', 'demon'];
    const currentIndex = characters.indexOf(this.selectedCharacter);
    const nextIndex = (currentIndex + 1) % characters.length;
    this.selectedCharacter = characters[nextIndex];

    this.restartScene();
  }
}
