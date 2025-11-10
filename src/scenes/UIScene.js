import Phaser from 'phaser';
import UIExpBar from '../ui/UIExpBar.js';
import UIHealthMana from '../ui/UIHealthMana.js';
import UISkillCooldown from '../ui/UISkillCooldown.js';
import SaveManager from '../utils/SaveManager.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.currentCharacterType = null;
  }

  async create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // === 중앙 상단: 경험치 바들 ===
    this.expBar = new UIExpBar(this, centerX, 20);

    // === 중앙 하단: HP/MP 바 ===
    const skillBarHeight = 80;
    const hpMpY = height - skillBarHeight - 70;
    this.healthMana = new UIHealthMana(this, centerX, hpMpY);

    // === 중앙 하단: 스킬 쿨다운 ===
    const skillY = height - skillBarHeight;
    this.skillCooldown = new UISkillCooldown(this, centerX, skillY);

    // === 디버그 로그 (좌측 하단) ===
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

    // 초기 데이터 로드
    await this.updateExpBars();

    // 🎯 GameScene 이벤트 리스너 등록
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      // 캐릭터 전환 이벤트
      gameScene.events.on('character-changed', async (characterType) => {
        this.currentCharacterType = characterType;
        await this.updatePlayerExp(characterType);
        console.log(`🔄 UI: 캐릭터 전환됨 -> ${characterType}`);
      });

      // ✅ 경험치 획득 이벤트 (CharacterBase에서 발행)
      gameScene.events.on('exp-gained', async (data) => {
        const { amount, characterType } = data;
        console.log(`📊 UI received exp-gained event:`, data);

        // UI만 업데이트 (저장은 CharacterBase에서 이미 함)
        await this.updateExpBars();
        this.addLog(`+${amount} EXP`, '#ffd43b');
      });
    }

    // 🎯 create 완료 이벤트
    this.events.emit('create');
  }

  update(time, delta) {
    // 필요시 애니메이션 업데이트
  }

  /**
   * 플레이어 UI 업데이트 (HP/MP)
   */
  updateUI(player) {
    if (!player) return;
    this.healthMana.update(player);
  }

  /**
   * 스킬 쿨다운 업데이트 (매 프레임)
   */
  updateSkillCooldowns(player) {
    if (!player || !player.skillSystem || !this.skillCooldown) return;
    this.skillCooldown.updateFromSkills(player.skillSystem.skills);
  }

  /**
   * 저장된 쿨타임 복원 (캐릭터 전환 시)
   */
  async restoreSkillCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;

    const savedCooldowns = await SaveManager.getSkillCooldowns(characterType);

    if (Object.keys(savedCooldowns).length > 0) {
      this.skillCooldown.restoreCooldowns(savedCooldowns, player.skillSystem.skills);
      console.log(`♻️ ${characterType} 스킬 쿨타임 복원:`, savedCooldowns);
    }

    await SaveManager.cleanExpiredCooldowns(characterType);
  }

  /**
   * 현재 쿨타임 저장 (캐릭터 전환 전)
   */
  async saveCurrentCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;

    const cooldowns = this.skillCooldown.getCurrentCooldowns(player.skillSystem.skills);

    if (Object.keys(cooldowns).length > 0) {
      await SaveManager.saveAllSkillCooldowns(characterType, cooldowns);
      console.log(`💾 ${characterType} 스킬 쿨타임 저장:`, cooldowns);
    }
  }

  /**
   * 경험치 바들 업데이트
   */
  async updateExpBars() {
    const expData = await SaveManager.getExpData();
    const totalExp = expData.totalExp || 0;

    // 총 경험치 (100 경험치당 1레벨)
    const level = Math.floor(totalExp / 100) + 1;
    const currentLevelExp = totalExp % 100;
    const nextLevelExp = 100;

    if (this.expBar) {
      this.expBar.updateTotalExp(currentLevelExp, nextLevelExp, level);
    }

    // 현재 캐릭터 경험치도 업데이트
    if (this.currentCharacterType) {
      await this.updatePlayerExp(this.currentCharacterType);
    }
  }

  /**
   * 플레이어 경험치 업데이트
   * @param {string} characterType - 'warrior', 'mage', 'assassin', etc.
   */
  async updatePlayerExp(characterType) {
    if (!characterType) return;

    const expData = await SaveManager.getExpData();
    const characterExp = expData.characterExp || {};
    const exp = characterExp[characterType] || 0;

    console.log(`📊 Updating player exp for ${characterType}: ${exp}`);

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
      this.logText.setStyle({ fill: color });

      // 3초 후 페이드아웃
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
   * ✅ 호환성을 위한 메서드들 (GameScene에서 호출됨)
   */
  async updateExpBar() {
    await this.updateExpBars();
  }

  async updateCharacterStats() {
    // 현재 캐릭터 경험치 업데이트
    if (this.currentCharacterType) {
      await this.updatePlayerExp(this.currentCharacterType);
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
}
