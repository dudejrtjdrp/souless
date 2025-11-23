import Phaser from 'phaser';
import CharacterSelectOverlay from '../systems/GameScene/CharacterSelectOverlay.js';
import UISkillCooldown from '../ui/UISkillCooldown.js';
import SkillIconLoader from '../utils/SkillIconLoader.js';

const CHARACTER_TYPES = [
  'soul',
  'assassin',
  'monk',
  'bladekeeper',
  'fireknight',
  'mauler',
  'princess',
];

const ICON_PNG_SIZE = 32;

export default class UITestScene extends Phaser.Scene {
  constructor() {
    super('UITestScene');
    this.selectedCharacter = 'soul';
    this.testPlayer = null;
    this.testSkillUnlockSystem = null;
  }

  preload() {
    this.load.spritesheet('ui_skill', 'assets/ui/skill_ui.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    CHARACTER_TYPES.forEach((charType) => {
      this.load.spritesheet(charType, `assets/ui/character/${charType}.png`, {
        frameWidth: ICON_PNG_SIZE,
        frameHeight: ICON_PNG_SIZE,
      });
      console.log(`✅ Spritesheet 로드: ${charType}.png`);
    });

    SkillIconLoader.preload(this);
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a1a1a)
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.add
      .text(width / 2, 30, 'UI Test Scene - Character Select & Skill Cooldown', {
        fontSize: '24px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    const controlsText = [
      '🎮 CONTROLS:',
      '` (Backtick) - Character Select UI 열기 (300ms 이상 누르기)',
      '← → - 캐릭터 선택',
      'Release ` - 캐릭터 확정',
      '',
      'Q/W/E/R/S/A - 스킬 쿨타임 테스트',
      'Space - 모든 쿨타임 초기화',
      'Number 1-4 - 플레이어 레벨 시뮬레이션 (10/20/30/40)',
    ].join('\n');

    this.add
      .text(20, 80, controlsText, {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Courier',
        lineSpacing: 6,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.characterInfoText = this.add
      .text(20, 320, '', {
        fontSize: '14px',
        color: '#51cf66',
        fontFamily: 'Courier',
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.characterSelectOverlay = new CharacterSelectOverlay(this);
    this.isBackQuoteHeld = false;
    this.backQuoteHoldStartTime = 0;

    this.characterSelectOverlay.characters = CHARACTER_TYPES;

    const skillBarHeight = 80;
    const skillY = height - skillBarHeight;
    this.skillCooldown = new UISkillCooldown(this, width / 2, skillY);

    this.createTestUnlockSystem();
    this.createTestPlayer();

    this.updateCharacterInfo();
    this.createCharacterSelectContainer();

    this.time.delayedCall(100, () => {
      this.setupInputHandlers();
      // ✅ 초기 아이콘 로드 추가
      this.applyInitialSkillIcons();
    });

    console.log('🎨 UITestScene 생성 완료');
  }

  // ✅ 초기 스킬 아이콘 적용 메서드 추가
  applyInitialSkillIcons() {
    console.log(`🎯 초기 스킬 아이콘 적용: ${this.selectedCharacter}`);
    SkillIconLoader.updateAllIcons(
      this,
      this.skillCooldown,
      this.selectedCharacter,
      this.skillCooldown.container,
    );
  }

  createTestUnlockSystem() {
    this.testSkillUnlockSystem = {
      currentLevel: 1,
      unlockedSkills: new Set(['Q', 'A']),

      isSkillUnlocked(skillKey) {
        return this.unlockedSkills.has(skillKey);
      },

      getRequiredLevel(skillKey) {
        const requirements = {
          Q: 1,
          W: 20,
          E: 30,
          R: 40,
          S: 10,
          A: 1,
        };
        return requirements[skillKey] || 99;
      },

      setLevel(level) {
        this.currentLevel = level;

        const skillUnlocks = {
          1: ['Q', 'A'],
          10: ['S'],
          20: ['W'],
          30: ['E'],
          40: ['R'],
        };

        this.unlockedSkills.clear();
        for (const [unlockLevel, skills] of Object.entries(skillUnlocks)) {
          if (level >= parseInt(unlockLevel)) {
            skills.forEach((s) => this.unlockedSkills.add(s));
          }
        }
        console.log(`📊 레벨 설정: ${level}, 해금된 스킬:`, Array.from(this.unlockedSkills));
      },

      setCurrentCharacter(characterType) {
        this.unlockedSkills.clear();
        this.unlockedSkills.add('Q');
        this.unlockedSkills.add('A');
        console.log(`🎯 캐릭터 설정: ${characterType}, 스킬:`, Array.from(this.unlockedSkills));
      },

      updateLevel(level) {
        this.setLevel(level);
      },
    };
  }

  createTestPlayer() {
    this.testPlayer = {
      health: 80,
      maxHealth: 100,
      mana: 50,
      maxMana: 100,

      skillSystem: {
        skills: new Map([
          [
            'q_skill',
            {
              key: 'q_skill',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 3000, cost: { mana: 20 } },
            },
          ],
          [
            'w_skill',
            {
              key: 'w_skill',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 5000, cost: { mana: 30 } },
            },
          ],
          [
            'e_skill',
            {
              key: 'e_skill',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 7000, cost: { mana: 40 } },
            },
          ],
          [
            'r_skill',
            {
              key: 'r_skill',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 10000, cost: { mana: 50 } },
            },
          ],
          [
            's_skill',
            {
              key: 's_skill',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 8000, cost: { mana: 35 }, healAmount: 30 },
            },
          ],
          [
            'attack',
            {
              key: 'attack',
              isActive: false,
              cooldownRemaining: 0,
              config: { cooldown: 500, cost: { mana: 0 } },
            },
          ],
        ]),
      },

      reduceSkillCooldown(skillKey, time) {
        const skill = this.skillSystem.skills.get(skillKey);
        if (skill) {
          skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - time);
        }
      },
    };
  }

  createCharacterSelectContainer() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const container = this.add.container(centerX, centerY);
    container.setScrollFactor(0);
    container.setDepth(10000);
    container.setVisible(false);

    const iconSpacing = 100;
    const charCount = this.characterSelectOverlay.characters.length;
    const bgWidth = Math.max(400, charCount * iconSpacing + 50);
    const bgHeight = 180;
    const iconY = 15;

    const ICON_BG_SIZE = 80;
    const ICON_IMAGE_SIZE = ICON_BG_SIZE - 4;

    const bg = this.add.rectangle(0, 0, bgWidth, bgHeight, 0x000000, 0.8);
    container.add(bg);

    const title = this.add
      .text(0, -bgHeight / 2 + 30, 'Select Character', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(title);

    const startX = -((charCount - 1) * iconSpacing) / 2;

    this.characterSelectOverlay.icons = [];

    this.characterSelectOverlay.characters.forEach((charType, index) => {
      const x = startX + index * iconSpacing;

      const iconBg = this.add.rectangle(x, iconY, ICON_BG_SIZE, ICON_BG_SIZE, 0x333333);

      const iconImage = this.add
        .image(x, iconY, charType, 0)
        .setDisplaySize(ICON_IMAGE_SIZE, ICON_IMAGE_SIZE);

      const nameText = this.add
        .text(x, iconY + 50, this.getCharacterName(charType), {
          fontSize: '12px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      const selector = this.add.rectangle(x, iconY, 88, 88, 0xffff00, 0);
      selector.setStrokeStyle(3, 0xffff00);

      this.characterSelectOverlay.icons.push({
        bg: iconBg,
        icon: iconImage,
        text: nameText,
        selector: selector,
        characterType: charType,
      });

      container.add([iconBg, iconImage, nameText, selector]);
    });

    const hint = this.add
      .text(0, bgHeight / 2 - 10, 'Use ← → to select, release ` to confirm', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    container.add(hint);

    this.characterSelectOverlay.container = container;
    this.characterSelectOverlay.updateSelection();
  }

  getCharacterName(charType) {
    const names = {
      soul: 'Soul',
      assassin: 'Assassin',
      warrior: 'Warrior',
      monk: 'Monk',
      magician: 'Magician',
      bladekeeper: 'Bladekeeper',
      fireknight: 'Fireknight',
      ranger: 'Ranger',
      mauler: 'Mauler',
      princess: 'Princess',
    };
    return names[charType] || charType;
  }

  setupInputHandlers() {
    this.input.keyboard.on('keydown-BACKTICK', (e) => {
      this.isBackQuoteHeld = true;
      this.backQuoteHoldStartTime = this.time.now;
      this.characterSelectOverlay.show();
      e.preventDefault();
    });

    this.input.keyboard.on('keyup-BACKTICK', (e) => {
      const holdDuration = this.time.now - this.backQuoteHoldStartTime;
      if (this.characterSelectOverlay.isVisible) {
        const selectedChar = this.characterSelectOverlay.getSelectedCharacter();
        this.characterSelectOverlay.hide();
        this.switchCharacter(selectedChar);
      } else if (holdDuration >= 300 && !this.characterSelectOverlay.isVisible) {
        this.characterSelectOverlay.show();
      }
      this.isBackQuoteHeld = false;
      e.preventDefault();
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.characterSelectOverlay.isVisible) {
        this.characterSelectOverlay.moveSelection('left');
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.characterSelectOverlay.isVisible) {
        this.characterSelectOverlay.moveSelection('right');
      }
    });

    this.input.keyboard.on('keydown', this.handleTestInput, this);
  }

  handleTestInput(event) {
    const key = event.key.toUpperCase();
    const skillMap = {
      Q: 'q_skill',
      W: 'w_skill',
      E: 'e_skill',
      R: 'r_skill',
      S: 's_skill',
      A: 'attack',
    };
    const levelMap = {
      1: 1,
      2: 20,
      3: 30,
      4: 40,
    };

    const skillKey = skillMap[key];
    if (skillKey) {
      const skillData = this.testPlayer.skillSystem.skills.get(skillKey);
      if (skillData && skillData.cooldownRemaining <= 0) {
        skillData.cooldownRemaining = skillData.config.cooldown;
        if (key === 'S') {
          this.testPlayer.health = Math.min(
            this.testPlayer.maxHealth,
            this.testPlayer.health + skillData.config.healAmount,
          );
          this.updateCharacterInfo();
        }
      }
    }

    const level = levelMap[key];
    if (level) {
      this.setPlayerLevel(level);
    }

    if (event.code === 'Space') {
      this.testPlayer.skillSystem.skills.forEach((skill) => {
        skill.cooldownRemaining = 0;
      });
      this.testPlayer.health = this.testPlayer.maxHealth;
      this.testPlayer.mana = this.testPlayer.maxMana;
      this.updateCharacterInfo();
    }
  }

  switchCharacter(characterType) {
    console.log(`🔄 캐릭터 전환: ${characterType}`);
    this.selectedCharacter = characterType;
    this.testSkillUnlockSystem.setCurrentCharacter(characterType);
    this.skillCooldown.setUnlockSystem(this.testSkillUnlockSystem);

    // ✅ 스킬 아이콘 업데이트 추가
    SkillIconLoader.updateAllIcons(
      this,
      this.skillCooldown,
      characterType,
      this.skillCooldown.container,
    );

    this.skillCooldown.updateLockStates();
    this.updateCharacterInfo();
  }

  setPlayerLevel(level) {
    this.testSkillUnlockSystem.setLevel(level);
    this.skillCooldown.setUnlockSystem(this.testSkillUnlockSystem);
    this.skillCooldown.updateLockStates();
    this.updateCharacterInfo();
  }

  updateCharacterInfo() {
    const unlockedSkills = Array.from(this.testSkillUnlockSystem.unlockedSkills).join(', ');

    this.characterInfoText.setText(
      [
        `Current Character: ${this.getCharacterName(this.selectedCharacter).toUpperCase()}`,
        `Player Level: ${this.testSkillUnlockSystem.currentLevel}`,
        `Unlocked Skills: ${unlockedSkills || 'None'}`,
        `Health: ${this.testPlayer.health} / ${this.testPlayer.maxHealth}`,
        `Mana: ${this.testPlayer.mana} / ${this.testPlayer.maxMana}`,
      ].join('\n'),
    );
  }

  update(time, delta) {
    this.testPlayer.skillSystem.skills.forEach((skill) => {
      if (skill.cooldownRemaining > 0) {
        skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - delta);
      }
    });

    if (this.skillCooldown) {
      this.skillCooldown.updateFromSkills(this.testPlayer, this.testPlayer.skillSystem.skills);
    }
  }
}
