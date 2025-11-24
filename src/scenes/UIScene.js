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

    // 0.5초 후 초기 설정 (모든 시스템이 준비된 후)
    this.time.delayedCall(500, () => {
      const gameScene = this.scene.get('GameScene');

      if (gameScene && gameScene.player && gameScene.selectedCharacter) {
        // 스킬 아이콘 업데이트
        SkillIconLoader.updateAllIcons(
          this,
          this.skillCooldown,
          gameScene.selectedCharacter,
          this.skillCooldown.container,
        );

        // 스킬 잠금 시스템 설정
        if (gameScene.skillUnlockSystem) {
          this.skillCooldown.setUnlockSystem(gameScene.skillUnlockSystem);
          this.skillCooldown.updateLockStates();
        }
      }
    });
  }

  setupEventListeners() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) {
      console.warn('GameScene not found');
      this.time.delayedCall(100, () => this.setupEventListeners());
      return;
    }

    // 기존 이벤트 리스너들
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

    // 캐릭터별 레벨업 이벤트 추가
    gameScene.events.off('character-level-up', this.handleCharacterLevelUp, this);
    gameScene.events.on('character-level-up', this.handleCharacterLevelUp, this);
  }

  handleCharacterLevelUp(data) {
    const { characterType, level } = data;

    // 현재 플레이 중인 캐릭터면 알림 표시
    if (characterType === this.currentCharacterType) {
      this.addLog(`레벨 업! Lv.${level}`, '#FFD700');

      // 스킬 잠금 상태 즉시 업데이트
      const gameScene = this.scene.get('GameScene');
      if (this.skillCooldown && gameScene?.skillUnlockSystem) {
        // 캐릭터 타입 재설정 (레벨 데이터 갱신)
        gameScene.skillUnlockSystem.setCurrentCharacter(characterType);

        // UI 업데이트
        this.skillCooldown.updateLockStates();

        // 새로 해금된 스킬 체크 및 알림
        const unlockedSkills = this.checkNewlyUnlockedSkills(level);
        if (unlockedSkills.length > 0) {
          this.time.delayedCall(500, () => {
            unlockedSkills.forEach((skill) => {
              this.addLog(`🔓 ${skill} 스킬이 해금되었습니다!`, '#51cf66');
            });
          });
        }
      }
    }

    // 경험치 바 즉시 업데이트
    this.scheduleExpUpdate();
  }

  checkNewlyUnlockedSkills(level) {
    const skillLevels = {
      Q: 10,
      W: 20,
      E: 30,
      R: 40,
    };

    const unlocked = [];
    Object.entries(skillLevels).forEach(([skill, reqLevel]) => {
      if (level === reqLevel) {
        unlocked.push(skill);
      }
    });

    return unlocked;
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

    const gameScene = this.scene.get('GameScene');

    // 1. 스킬 잠금 시스템 먼저 설정
    if (gameScene?.skillUnlockSystem) {
      gameScene.skillUnlockSystem.setCurrentCharacter(characterType);

      this.skillCooldown.setUnlockSystem(gameScene.skillUnlockSystem);
    }

    // 2. 스킬 아이콘 업데이트
    if (player && player.skillSystem) {
      SkillIconLoader.updateAllIcons(
        this,
        this.skillCooldown,
        characterType,
        this.skillCooldown.container,
      );
    }

    // 3. 쿨다운 복원
    await this.restoreSkillCooldowns(characterType, player);

    // 4. 경험치 바 업데이트
    await this.updatePlayerExp(characterType);

    // 5. 체력/마나 UI 업데이트
    if (player) {
      this.updateUI(player);
      this.handleSkillCooldownsUpdated(data);
    }

    // 6. 잠금 상태 강제 업데이트 (여러 번 시도)
    if (gameScene?.skillUnlockSystem) {
      // 즉시 업데이트
      this.skillCooldown.updateLockStates();

      // 0.1초 후 재시도
      this.time.delayedCall(100, () => {
        this.skillCooldown.updateLockStates();
      });

      // 0.3초 후 재시도
      this.time.delayedCall(300, () => {
        this.skillCooldown.updateLockStates();

        // 스킬 쿨다운도 함께 업데이트
        if (player?.skillSystem) {
          this.skillCooldown.updateFromSkills(player, player.skillSystem.skills);
        }
      });
    }

    this.addLog(`${characterType} 활성화`, '#51cf66');
  }

  handleExpGained(data) {
    const { amount, characterType, levelInfo, characterLevelInfo, characterExp } = data;

    if (!levelInfo || characterExp === undefined) return;

    // 로그
    this.addLog(`+${amount} EXP`, '#ffd43b');

    // 전체 레벨 즉시 업데이트
    this.updateTotalExpDirectSync(levelInfo);

    // 캐릭터 레벨 즉시 업데이트 (레벨 정보 포함)
    if (characterLevelInfo) {
      this.updateCharacterExpDirectSync(characterType, characterLevelInfo);
    } else {
      // fallback: 기존 방식
      this.updatePlayerExpDirectSync(characterType, characterExp);
    }
  }

  updateCharacterExpDirectSync(characterType, charLevelInfo) {
    if (!this.expBar) {
      console.warn('⚠️ ExpBar not initialized');
      return;
    }

    // ExpBar의 updatePlayerExpSync가 자동으로 레벨 정보를 가져옴
    this.expBar.updatePlayerExpSync(characterType, 0);
  }

  updateTotalExpDirectSync(levelInfo) {
    if (!levelInfo) return;

    // null 체크 추가
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
    // null 체크 추가
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

      // 스킬 잠금 상태 업데이트
      const gameScene = this.scene.get('GameScene');
      if (this.skillCooldown && gameScene?.player?.skillSystem) {
        this.skillCooldown.updateFromSkills(gameScene.player, gameScene.player.skillSystem.skills);
      }

      if (this.currentCharacterType) {
        await this.updatePlayerExp(this.currentCharacterType);
      }
    } catch (error) {
      console.error('경험치 업데이트 실패:', error);
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

    if (gameScene?.player?.skillSystem && gameScene?.skillUnlockSystem && this.skillCooldown) {
      // 스킬 쿨다운 업데이트
      this.skillCooldown.updateFromSkills(gameScene.player, gameScene.player.skillSystem.skills);
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
      console.error('경험치 바 업데이트 실패:', error);
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
      console.error('캐릭터 경험치 업데이트 실패:', error);
    }
  }

  addLog(message, color = '#ffffff') {
    // null 체크 추가
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
