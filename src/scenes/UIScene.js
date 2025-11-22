import Phaser from 'phaser';
import UIExpBar from '../ui/UIExpBar.js';
import UIHealthMana from '../ui/UIHealthMana.js';
import UISkillCooldown from '../ui/UISkillCooldown.js';
import SaveSlotManager from '../utils/SaveSlotManager.js';
import SkillIconLoader from '../utils/SkillIconLoader.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.currentCharacterType = null;
    this.currentGameScene = null;
    this.isUpdatingExp = false;
    this.pendingExpUpdate = false;
  }

  preload() {
    this.load.spritesheet('ui_skill', 'assets/ui/skill_ui.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    SkillIconLoader.preload(this);
  }

  async create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.expBar = new UIExpBar(this, centerX, 20);

    const skillBarHeight = 80;
    const hpMpY = height - skillBarHeight - 70;
    this.healthMana = new UIHealthMana(this, centerX, hpMpY);

    const skillY = height - skillBarHeight;
    this.skillCooldown = new UISkillCooldown(this, centerX, skillY);

    this.logText = this.add
      .text(16, height - 30, '', {
        fontSize: '14px',
        fill: '#cccccc',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.8);

    this.setupEventListeners();

    await this.updateExpBars();

    this.events.emit('ui-ready');

    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.player && gameScene.selectedCharacter) {
      this.time.delayedCall(0, () => {
        SkillIconLoader.updateAllIcons(
          this,
          this.skillCooldown,
          gameScene.selectedCharacter,
          this.skillCooldown.container,
        );
      });
    }
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) {
      console.warn('⚠️ GameScene not found, retrying...');
      this.time.delayedCall(100, () => this.setupEventListeners());
      return;
    }

    gameScene.events.off('character-switching', this.handleCharacterSwitching, this);
    gameScene.events.on('character-switching', this.handleCharacterSwitching, this);

    gameScene.events.off('character-changed', this.handleCharacterChanged, this);
    gameScene.events.on('character-changed', this.handleCharacterChanged, this);

    gameScene.events.off('exp-gained', this.handleExpGained, this);
    gameScene.events.on('exp-gained', this.handleExpGained, this);

    gameScene.events.off('player-stats-updated', this.handlePlayerStatsUpdated, this);
    gameScene.events.on('player-stats-updated', this.handlePlayerStatsUpdated, this);

    gameScene.events.off('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
    gameScene.events.on('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
  }

  async handleCharacterSwitching(data) {
    const { previousCharacterType, player } = data;
    if (previousCharacterType && player) {
      await this.saveCurrentCooldowns(previousCharacterType, player);
      this.addLog(`${previousCharacterType} 쿨다운 저장됨`, '#74c0fc');
    }
  }

  async handleCharacterChanged(data) {
    const { characterType, player } = data;
    this.currentCharacterType = characterType;

    if (player && player.skillSystem) {
      SkillIconLoader.updateAllIcons(
        this,
        this.skillCooldown,
        characterType,
        this.skillCooldown.container,
      );
      await this.restoreSkillCooldowns(characterType, player);
    }

    await this.updatePlayerExp(characterType);

    if (player) {
      this.updateUI(player);
      this.handleSkillCooldownsUpdated(data);
    }

    this.addLog(`${characterType} 활성화`, '#51cf66');
  }

  handleExpGained(data) {
    const { amount, characterType, levelInfo, characterExp } = data;

    if (!levelInfo || characterExp === undefined) return;

    // 로그
    this.addLog(`+${amount} EXP`, '#ffd43b');

    // 즉시 업데이트 (동기 처리)
    this.updateTotalExpDirectSync(levelInfo);
    this.updatePlayerExpDirectSync(characterType, characterExp);
  }

  updateTotalExpDirectSync(levelInfo) {
    if (!levelInfo) return;

    // ✅ null 체크 추가
    if (!this.expBar || !this.expBar.totalExpBar || !this.expBar.totalExpText) {
      console.warn('⚠️ ExpBar not ready');
      return;
    }

    const { level, experience, experienceToNext } = levelInfo;

    const percent = Math.min(experience / experienceToNext, 1);
    const width = this.expBar.barWidth * percent;

    // 게이지 그리기
    this.expBar.totalExpBar.clear();
    this.expBar.drawExpGradient(
      this.expBar.totalExpBar,
      0,
      0,
      width,
      this.expBar.barHeight,
      0xffd43b,
      0xf59f00,
    );

    // 텍스트
    this.expBar.totalExpText.setText(`Lv.${level} | ${experience} / ${experienceToNext}`);

    // 레벨업 효과
    if (percent >= 1) {
      this.expBar.playLevelUpEffect(this.expBar.totalExpContainer);
    }
  }

  updatePlayerExpDirectSync(characterType, exp) {
    // ✅ null 체크 추가
    if (!this.expBar) {
      console.warn('⚠️ ExpBar not initialized');
      return;
    }

    const validExp = typeof exp === 'number' && exp >= 0 ? exp : 0;
    this.expBar.updatePlayerExpSync(characterType, validExp);
  }

  updatePlayerExpDirect(characterType, exp) {
    if (!this.expBar || exp === undefined) return;

    const validExp = typeof exp === 'number' && exp >= 0 ? exp : 0;
    this.expBar.updatePlayerExp(characterType, validExp);
  }

  updateTotalExpDirect(levelInfo) {
    const { level, experience, experienceToNext } = levelInfo;

    if (!this.expBar?.totalExpBar) return;

    const percent = Math.min(experience / experienceToNext, 1);

    // 게이지 그리기
    this.expBar.totalExpBar.clear();
    const width = this.expBar.barWidth * percent;

    this.expBar.drawExpGradient(
      this.expBar.totalExpBar,
      0,
      0,
      width,
      this.expBar.barHeight,
      0xffd43b,
      0xf59f00,
    );

    // 텍스트 업데이트
    if (this.expBar.totalExpText) {
      this.expBar.totalExpText.setText(`Lv.${level} | ${experience} / ${experienceToNext}`);
    }

    // 레벨업 효과
    if (percent >= 1) {
      this.expBar.playLevelUpEffect(this.expBar.totalExpContainer);
    }
  }

  async scheduleExpUpdate() {
    // 이미 업데이트 중이면 큐에 추가
    if (this.isUpdatingExp) {
      this.pendingExpUpdate = true;
      return;
    }

    this.isUpdatingExp = true;

    try {
      //  localStorage 동기화 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // UI 업데이트
      await this.expBar.updateTotalExp();

      if (this.currentCharacterType) {
        await this.updatePlayerExp(this.currentCharacterType);
      }
    } catch (error) {
      console.error('❌ 경험치 업데이트 실패:', error);
    } finally {
      this.isUpdatingExp = false;

      // 대기 중인 업데이트가 있으면 재실행
      if (this.pendingExpUpdate) {
        this.pendingExpUpdate = false;

        this.time.delayedCall(50, () => {
          this.scheduleExpUpdate();
        });
      }
    }
  }

  handlePlayerStatsUpdated(player) {
    if (!player) return;
    this.updateUI(player);
  }

  handleSkillCooldownsUpdated(data) {
    const { player } = data;
    if (!player || !player.skillSystem || !this.skillCooldown) return;
    this.skillCooldown.updateFromSkills(player, player.skillSystem.skills);
  }

  update(time, delta) {
    const gameScene = this.scene.get('GameScene');

    if (gameScene && this.currentGameScene !== gameScene) {
      this.currentGameScene = gameScene;
      this.setupEventListeners();

      if (gameScene.player) {
        this.handleCharacterChanged({
          characterType: gameScene.selectedCharacter,
          player: gameScene.player,
        });
      }
    }
  }

  updateUI(player) {
    if (!player) return;
    this.healthMana.update(player);
  }

  async restoreSkillCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;
    await SaveSlotManager.cleanExpiredCooldowns(characterType);
  }

  async saveCurrentCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;

    const cooldowns = this.skillCooldown.getCurrentCooldowns(player.skillSystem.skills);

    if (Object.keys(cooldowns).length > 0) {
      await SaveSlotManager.saveAllSkillCooldowns(characterType, cooldowns);
    }
  }

  // 수정: SaveSlotManager에서 저장된 데이터 직접 로드
  async updateExpBars() {
    try {
      // SaveSlotManager에서 저장된 전체 데이터 로드
      const saveData = await SaveSlotManager.load();

      if (saveData && saveData.levelSystem) {
        const levelSystem = saveData.levelSystem;

        await this.expBar.updateTotalExp();
      }

      if (this.currentCharacterType) {
        await this.updatePlayerExp(this.currentCharacterType);
      }
    } catch (error) {
      console.error('❌ 경험치 바 업데이트 실패:', error);
    }
  }

  async updatePlayerExp(characterType) {
    if (!characterType) return;

    try {
      const expData = await SaveSlotManager.getExpData();
      const characterExp = expData.characterExp || {};
      const exp = characterExp[characterType] || 0;

      if (this.expBar) {
        this.expBar.updatePlayerExp(characterType, exp);
      }
    } catch (error) {
      console.error('❌ 캐릭터 경험치 업데이트 실패:', error);
    }
  }

  addLog(message, color = '#ffffff') {
    // ✅ null 체크 추가
    if (!this.logText) {
      console.warn('⚠️ LogText not initialized');
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    this.logText.setText(`[${timestamp}] ${message}`);
    this.logText.setStyle({ fill: color });

    this.time.delayedCall(3000, () => {
      if (this.logText) {
        this.tweens.add({
          targets: this.logText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (this.logText) {
              this.logText.setText('');
              this.logText.setAlpha(0.8);
            }
          },
        });
      }
    });
  }

  hide() {
    if (this.expBar) this.expBar.hide();
    if (this.healthMana) this.healthMana.hide();
    if (this.skillCooldown) this.skillCooldown.hide();
  }

  show() {
    if (this.expBar) this.expBar.show();
    if (this.healthMana) this.healthMana.show();
    if (this.skillCooldown) this.skillCooldown.show();
  }

  shutdown() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('character-switching', this.handleCharacterSwitching, this);
      gameScene.events.off('character-changed', this.handleCharacterChanged, this);
      gameScene.events.off('exp-gained', this.handleExpGained, this);
      gameScene.events.off('player-stats-updated', this.handlePlayerStatsUpdated, this);
      gameScene.events.off('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
    }
    this.currentGameScene = null;
  }
}
