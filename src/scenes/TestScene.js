import Phaser from 'phaser';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
import CharacterFactory from '../characters/base/CharacterFactory.js';
import { EffectLoader } from '../systems/Effects/EffectLoader.js';
import { EffectManager } from '../systems/Effects/EffectManager.js';

export default class EffectTestScene extends Phaser.Scene {
  constructor() {
    super('EffectTestScene');
  }

  init() {
    this.testEffectKeys = ['effect_1', 'effect_2', 'effect_3', 'effect_4'];
    this.characterTypes = CharacterFactory.getAvailableTypes();
    this.floors = [];
    this.platforms = null;
    this.autoPlayEnabled = false;
    this.autoPlayInterval = null;
  }

  preload() {
    CharacterAssetLoader.preload(this);

    this.effectManager = new EffectManager(this);
    this.effectManager.setDebug(true);
    EffectLoader.preloadAllEffects(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.physics.world.gravity.y = 800;

    // 이펙트 애니메이션 생성
    EffectLoader.createAllAnimations(this);

    // 바닥 및 층 생성
    this.createFloors();

    // UI 생성
    this.createUI();

    // 각 층에 캐릭터들 생성
    this.createCharactersOnFloors();

    // 입력 설정
    this.setupInput();

    // 상태 표시
    this.effectManager.logStatus();
  }

  createFloors() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    //  floorEffects 배열 확인
    if (!this.floorEffects || this.floorEffects.length === 0) {
      console.error('floorEffects is not initialized!');
      this.floorEffects = this.testEffectKeys;
    }

    const floorCount = this.floorEffects.length;
    const floorHeight = (height - 200) / floorCount; // 상단 UI 공간 제외

    this.platforms = this.physics.add.staticGroup();

    for (let i = 0; i < floorCount; i++) {
      const floorY = 150 + floorHeight * (i + 1);

      // 바닥 플랫폼
      const platform = this.add.rectangle(width / 2, floorY, width - 40, 20, 0x2c3e50);
      this.platforms.add(platform);

      // 바닥 라인 (시각적)
      this.add.rectangle(width / 2, floorY - 10, width - 40, 2, 0x34495e);

      // 층 번호와 이펙트 이름 표시
      const floorNumber = floorCount - i; // 위에서부터 4층, 3층, 2층, 1층
      const effectKey = this.floorEffects[floorNumber - 1];

      this.add
        .text(20, floorY - 60, `${floorNumber}F`, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setDepth(1000);

      this.add
        .text(20, floorY - 35, effectKey || 'No Effect', {
          fontSize: '14px',
          fontFamily: 'Courier',
          color: '#00ff00',
          backgroundColor: '#00000088',
          padding: { x: 5, y: 2 },
        })
        .setDepth(1000);

      this.floors.push({
        floorNumber,
        y: floorY,
        effectKey,
        characters: [],
      });
    }
  }

  createUI() {
    const width = this.cameras.main.width;

    // 타이틀
    this.add
      .text(width / 2, 30, '🎮 Multi-Floor Effect Test', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // 설명 텍스트
    const instructions = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '[ Controls ]',
      'A / Q: Basic Attack All',
      'W: Skill 1  |  E: Skill 2  |  R: Skill 3',
      '1-4: Test Floor Effect (1F-4F)',
      'T: Test All Floor Effects',
      'SPACE: Auto Play (Toggle)',
      'F: Toggle Flip All',
      'ESC: Return to Game',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ];

    this.instructionText = this.add
      .text(width / 2, 70, instructions.join('\n'), {
        fontSize: '13px',
        fontFamily: 'Courier',
        color: '#00ff00',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 8 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Auto Play 상태 표시
    this.autoPlayText = this.add
      .text(width - 20, 30, '⏸ Auto Play: OFF', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ff6b6b',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5)
      .setDepth(1000);

    // 상태 표시
    this.statusText = this.add
      .text(width / 2, 160, '', {
        fontSize: '14px',
        fontFamily: 'Courier',
        color: '#ffff00',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);
  }

  createCharactersOnFloors() {
    const width = this.cameras.main.width;
    const spacing = (width - 100) / (this.characterTypes.length + 1);

    this.floors.forEach((floor) => {
      this.characterTypes.forEach((type, index) => {
        const x = 50 + spacing * (index + 1);
        // 캐릭터를 바닥보다 충분히 위에 배치 (바닥 - 100픽셀)
        const y = floor.y - 200;

        // 캐릭터 생성
        const character = CharacterFactory.create(this, type, x, y, {
          scale: 2.0,
        });

        // 물리 바디 설정
        if (character.sprite.body) {
          // 중력을 받도록 설정
          character.sprite.body.setAllowGravity(true);
          // 바운스 제거
          character.sprite.body.setBounce(0);
          // 충돌 박스 조정 (선택적)
          character.sprite.body.setSize(
            character.sprite.width * 0.6,
            character.sprite.height * 0.9,
          );
        }

        // 물리 바디에 충돌 추가
        this.physics.add.collider(character.sprite, this.platforms);

        floor.characters.push({
          character,
          type,
          x,
          y,
        });
      });
    });
  }

  setupInput() {
    const keys = this.input.keyboard.addKeys({
      ONE: 'ONE',
      TWO: 'TWO',
      THREE: 'THREE',
      FOUR: 'FOUR',
      A: 'A',
      Q: 'Q',
      W: 'W',
      E: 'E',
      R: 'R',
      T: 'T',
      F: 'F',
      SPACE: 'SPACE',
      ESC: 'ESC',
    });

    // 층별 이펙트 테스트
    keys.ONE.on('down', () => this.testFloorEffect(1));
    keys.TWO.on('down', () => this.testFloorEffect(2));
    keys.THREE.on('down', () => this.testFloorEffect(3));
    keys.FOUR.on('down', () => this.testFloorEffect(4));

    // 스킬 실행 (모든 캐릭터)
    keys.A.on('down', () => this.executeSkillAll('basicAttack'));
    keys.Q.on('down', () => this.executeSkillAll('basicAttack'));
    keys.W.on('down', () => this.executeSkillAll('skill1'));
    keys.E.on('down', () => this.executeSkillAll('skill2'));
    keys.R.on('down', () => this.executeSkillAll('skill3'));

    // 모든 층 이펙트 테스트
    keys.T.on('down', () => this.testAllFloorEffects());

    // 방향 전환
    keys.F.on('down', () => this.toggleFlipAll());

    // Auto Play 토글
    keys.SPACE.on('down', () => this.toggleAutoPlay());

    // 씬 종료
    keys.ESC.on('down', () => this.exitTestScene());
  }

  testFloorEffect(floorNumber) {
    const floor = this.floors.find((f) => f.floorNumber === floorNumber);
    if (!floor || !floor.effectKey) {
      this.updateStatus(`⚠ Floor ${floorNumber} has no effect`);
      return;
    }

    floor.characters.forEach((charData) => {
      const sprite = charData.character.sprite;
      const x = sprite.x + (sprite.flipX ? -30 : 30);
      const y = sprite.y - 20;

      this.effectManager.playEffect(floor.effectKey, x, y, sprite.flipX);
      this.flashCharacter(charData);
    });

    this.updateStatus(`Testing ${floorNumber}F: ${floor.effectKey}`);
  }

  testAllFloorEffects() {
    this.floors.forEach((floor) => {
      if (!floor.effectKey) return;

      floor.characters.forEach((charData) => {
        const sprite = charData.character.sprite;
        const x = sprite.x + (sprite.flipX ? -30 : 30);
        const y = sprite.y - 20;

        this.effectManager.playEffect(floor.effectKey, x, y, sprite.flipX);
        this.flashCharacter(charData);
      });
    });

    this.updateStatus('Testing all floor effects!');
  }

  executeSkillAll(skillName) {
    let executed = false;

    this.floors.forEach((floor) => {
      floor.characters.forEach((charData) => {
        const character = charData.character;

        if (character[skillName]) {
          character[skillName]();
          this.flashCharacter(charData);
          executed = true;
        }
      });
    });

    if (executed) {
      this.updateStatus(`All executed: ${skillName.toUpperCase()}`);
    } else {
      this.updateStatus(`⚠ ${skillName} not available`);
    }
  }

  toggleFlipAll() {
    this.floors.forEach((floor) => {
      floor.characters.forEach((charData) => {
        const sprite = charData.character.sprite;
        sprite.setFlipX(!sprite.flipX);
      });
    });

    this.updateStatus('Flipped all characters');
  }

  toggleAutoPlay() {
    this.autoPlayEnabled = !this.autoPlayEnabled;

    if (this.autoPlayEnabled) {
      this.autoPlayText.setText('▶ Auto Play: ON');
      this.autoPlayText.setColor('#00ff00');
      this.startAutoPlay();
    } else {
      this.autoPlayText.setText('⏸ Auto Play: OFF');
      this.autoPlayText.setColor('#ff6b6b');
      this.stopAutoPlay();
    }
  }

  startAutoPlay() {
    this.stopAutoPlay();

    this.autoPlayInterval = this.time.addEvent({
      delay: 2000,
      callback: () => {
        // 랜덤 층 선택
        const randomFloor = Math.floor(Math.random() * this.floors.length) + 1;
        this.testFloorEffect(randomFloor);

        // 랜덤 스킬 실행 (30% 확률)
        if (Math.random() < 0.3) {
          const skills = ['basicAttack', 'skill1', 'skill2', 'skill3'];
          const randomSkill = skills[Math.floor(Math.random() * skills.length)];
          this.executeSkillAll(randomSkill);
        }

        // 랜덤으로 방향 전환 (20% 확률)
        if (Math.random() < 0.2) {
          this.toggleFlipAll();
        }
      },
      loop: true,
    });
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      this.autoPlayInterval.remove();
      this.autoPlayInterval = null;
    }
  }

  flashCharacter(charData) {
    const sprite = charData.character.sprite;
    sprite.setTint(0xffffff);

    this.time.delayedCall(100, () => {
      sprite.clearTint();
    });
  }

  updateStatus(message = '') {
    this.statusText.setText(`⚡ ${message}`);
  }

  exitTestScene() {
    this.stopAutoPlay();
    this.scene.start('GameScene');
  }

  update(time, delta) {
    // 모든 층의 모든 캐릭터 업데이트
    this.floors.forEach((floor) => {
      floor.characters.forEach(({ character }) => {
        if (character && character.update) {
          character.update();
        }
      });
    });

    // 이펙트 매니저 업데이트
    if (this.effectManager) {
      this.effectManager.update();
    }
  }

  shutdown() {
    this.stopAutoPlay();

    // 모든 캐릭터 정리
    this.floors.forEach((floor) => {
      floor.characters.forEach(({ character }) => {
        if (character && character.destroy) {
          character.destroy();
        }
      });
    });

    this.floors = [];
  }
}
