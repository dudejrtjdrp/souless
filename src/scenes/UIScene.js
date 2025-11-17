import Phaser from 'phaser';
import UIExpBar from '../ui/UIExpBar.js';
import UIHealthMana from '../ui/UIHealthMana.js';
import UISkillCooldown from '../ui/UISkillCooldown.js';
import SaveManager from '../utils/SaveManager.js';
import SkillIconLoader from '../utils/SkillIconLoader.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.currentCharacterType = null;
    this.currentGameScene = null; // GameScene 참조를 유지
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
    const centerX = width / 2; // === 중앙 상단: 경험치 바들 ===

    this.expBar = new UIExpBar(this, centerX, 20); // === 중앙 하단: HP/MP 바 ===

    const skillBarHeight = 80;
    const hpMpY = height - skillBarHeight - 70;
    this.healthMana = new UIHealthMana(this, centerX, hpMpY); // === 중앙 하단: 스킬 쿨다운 ===

    const skillY = height - skillBarHeight;
    this.skillCooldown = new UISkillCooldown(this, centerX, skillY); // === 디버그 로그 (좌측 하단) ===

    this.logText = this.add
      .text(16, height - 30, '', {
        fontSize: '14px',
        fill: '#cccccc',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.8); //  게임 이벤트 리스너 등록

    this.setupEventListeners(); // 초기 데이터 로드

    await this.updateExpBars(); //  create 완료 이벤트

    this.events.emit('ui-ready');

    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.player && gameScene.selectedCharacter) {
      // 약간의 딜레이를 줘서 모든 텍스처 로딩 완료 보장
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
    } // **추가:** 캐릭터 전환 전에 쿨다운 저장을 위한 이벤트

    gameScene.events.off('character-switching', this.handleCharacterSwitching, this); // 이전 리스너 제거
    gameScene.events.on('character-switching', this.handleCharacterSwitching, this); // 캐릭터 변경 이벤트 (전환 완료 후)

    gameScene.events.off('character-changed', this.handleCharacterChanged, this);
    gameScene.events.on('character-changed', this.handleCharacterChanged, this); // 경험치 획득 이벤트

    gameScene.events.off('exp-gained', this.handleExpGained, this);
    gameScene.events.on('exp-gained', this.handleExpGained, this); // HP/MP 업데이트 이벤트

    gameScene.events.off('player-stats-updated', this.handlePlayerStatsUpdated, this);
    gameScene.events.on('player-stats-updated', this.handlePlayerStatsUpdated, this); // 스킬 쿨다운 업데이트 이벤트

    gameScene.events.off('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
    gameScene.events.on('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
  }
  /**
   *  **추가:** 캐릭터 전환 직전 핸들러 (이전 캐릭터 쿨다운 저장)
   */

  async handleCharacterSwitching(data) {
    const { previousCharacterType, player } = data;
    if (previousCharacterType && player) {
      // 이전 캐릭터의 쿨다운을 저장
      await this.saveCurrentCooldowns(previousCharacterType, player);
      this.addLog(`${previousCharacterType} 쿨다운 저장됨`, '#74c0fc');
    }
  }
  /**
   *  캐릭터 변경 핸들러 (전환 완료 후)
   */

  async handleCharacterChanged(data) {
    const { characterType, player } = data;
    this.currentCharacterType = characterType; // 스킬 아이콘 업데이트

    if (player && player.skillSystem) {
      SkillIconLoader.updateAllIcons(
        this,
        this.skillCooldown,
        characterType,
        this.skillCooldown.container,
      ); // **수정:** 쿨다운 복원은 SaveManager 내부에서 최신 상태로 갱신 (player.skillSystem에 반영)
      await this.restoreSkillCooldowns(characterType, player);
    } // 경험치 바 업데이트

    await this.updatePlayerExp(characterType); //  HP/MP 업데이트

    if (player) {
      this.updateUI(player); // **추가:** 복원 후 UI 쿨다운 강제 갱신
      this.handleSkillCooldownsUpdated(data);
    }

    this.addLog(`${characterType} 활성화`, '#51cf66');
  }
  /**
   *  경험치 획득 핸들러
   */

  async handleExpGained(data) {
    const { amount, characterType } = data; // 즉시 UI 업데이트
    await this.updateExpBars();
    this.addLog(`+${amount} EXP`, '#ffd43b');
  }
  /**
   *  플레이어 스탯 업데이트 핸들러
   */

  handlePlayerStatsUpdated(player) {
    if (!player) return;
    this.updateUI(player);
  }
  /**
   *  스킬 쿨다운 업데이트 핸들러
   */

  handleSkillCooldownsUpdated(data) {
    const { player } = data;
    if (!player || !player.skillSystem || !this.skillCooldown) return;
    this.skillCooldown.updateFromSkills(player, player.skillSystem.skills);
  }

  update(time, delta) {
    const gameScene = this.scene.get('GameScene'); // 새 GameScene이 이전과 다르면 이벤트 재연결

    if (gameScene && this.currentGameScene !== gameScene) {
      this.currentGameScene = gameScene;
      this.setupEventListeners(); // 캐릭터 상태 강제 갱신

      if (gameScene.player) {
        // 새로운 씬 시작 시에는 'character-changed'만으로 충분
        this.handleCharacterChanged({
          characterType: gameScene.selectedCharacter,
          player: gameScene.player,
        });
      }
    }
  }
  /**
   * 플레이어 UI 업데이트 (HP/MP)
   */

  updateUI(player) {
    if (!player) return;
    this.healthMana.update(player);
  }
  /**
   * 저장된 쿨타임 복원 (캐릭터 전환 시)
   * **SaveManager.loadAllSkillCooldowns()로직이 player.skillSystem에 직접 반영된다고 가정**
   */

  async restoreSkillCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return; // SaveManager를 사용하여 만료된 쿨다운 정리 및 현재 캐릭터의 스킬 쿨다운 복원

    await SaveManager.loadAllSkillCooldowns(characterType, player.skillSystem);
  }
  /**
   * 현재 쿨타임 저장 (캐릭터 전환 전)
   */

  async saveCurrentCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return; // 쿨다운 시스템에서 현재 활성화된 쿨다운 데이터를 가져옴

    const cooldowns = this.skillCooldown.getCurrentCooldowns(player.skillSystem.skills);

    if (Object.keys(cooldowns).length > 0) {
      await SaveManager.saveAllSkillCooldowns(characterType, cooldowns);
    }
  }
  /**
   * 경험치 바들 업데이트
   */

  async updateExpBars() {
    const expData = await SaveManager.getExpData();
    const totalExp = expData.totalExp || 0; // 총 경험치 (100 경험치당 1레벨)

    const level = Math.floor(totalExp / 100) + 1;
    const currentLevelExp = totalExp % 100;
    const nextLevelExp = 100;

    if (this.expBar) {
      this.expBar.updateTotalExp(currentLevelExp, nextLevelExp, level);
    } // 현재 캐릭터 경험치도 업데이트

    if (this.currentCharacterType) {
      await this.updatePlayerExp(this.currentCharacterType);
    }
  }
  /**
   * 플레이어 경험치 업데이트
   */

  async updatePlayerExp(characterType) {
    if (!characterType) return;

    const expData = await SaveManager.getExpData();
    const characterExp = expData.characterExp || {};
    const exp = characterExp[characterType] || 0;

    if (this.expBar) {
      this.expBar.updatePlayerExp(characterType, exp);
    }
  }
  /**
   * 로그 추가
   */

  addLog(message, color = '#ffffff') {
    if (this.logText) {
      const timestamp = new Date().toLocaleTimeString();
      this.logText.setText(`[${timestamp}] ${message}`);
      this.logText.setStyle({ fill: color }); // 3초 후 페이드아웃

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
  }
  /**
   * 전체 UI 숨기기/보이기
   */

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
  /**
   * Scene 종료 시 이벤트 리스너 정리
   */

  shutdown() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('character-switching', this.handleCharacterSwitching, this); // **추가됨**
      gameScene.events.off('character-changed', this.handleCharacterChanged, this);
      gameScene.events.off('exp-gained', this.handleExpGained, this);
      gameScene.events.off('player-stats-updated', this.handlePlayerStatsUpdated, this);
      gameScene.events.off('skill-cooldowns-updated', this.handleSkillCooldownsUpdated, this);
    }
    this.currentGameScene = null;
  }
}
