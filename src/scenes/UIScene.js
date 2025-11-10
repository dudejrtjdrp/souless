import Phaser from 'phaser';
import UIExpBar from '../ui/UIExpBar.js';
import UICharacterStats from '../ui/UICharacterStats.js';
import UISkillCooldown from '../ui/UISkillCooldown.js';
import SaveManager from '../utils/SaveManager.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  async create() {
    // 기본 텍스트 UI
    this.healthText = this.add.text(16, 216, 'HP: 0', { fontSize: '16px', fill: '#ff4d4d' });
    this.manaText = this.add.text(16, 236, 'MP: 0', { fontSize: '16px', fill: '#4d79ff' });
    this.expText = this.add.text(16, 256, 'EXP: 0', { fontSize: '16px', fill: '#ffff4d' });
    this.logText = this.add.text(16, 280, '', { fontSize: '14px', fill: '#cccccc' });

    [this.healthText, this.manaText, this.expText, this.logText].forEach((t) =>
      t.setScrollFactor(0).setDepth(1000),
    );

    // 경험치 바
    this.expBar = new UIExpBar(this, 20, 70);

    // 캐릭터별 경험치 통계
    this.characterStats = new UICharacterStats(this, 20, 100);

    // 🔹 스킬 쿨타임 UI
    this.skillCooldown = new UISkillCooldown(this, 20, 320);

    // 초기 로드
    await this.updateExpBar();
    await this.updateCharacterStats();

    // 🎯 create 완료 이벤트 발생
    this.events.emit('create');
  }

  update(time, delta) {
    // 스킬 쿨타임 UI는 자체적으로 업데이트 필요 없음
    // GameScene의 updateSkillCooldowns()를 통해 업데이트됨
  }

  /**
   * 플레이어 UI 업데이트 (HP/MP)
   */
  updateUI(player) {
    if (!player) return;

    this.healthText.setText(`HP: ${Math.round(player.health)}/${Math.round(player.maxHealth)}`);
    this.manaText.setText(`MP: ${Math.round(player.mana)}/${Math.round(player.maxMana)}`);
  }

  /**
   * 스킬 쿨다운 업데이트 (매 프레임)
   * @param {Object} player - player.skillSystem.skills를 가지고 있어야 함
   */
  updateSkillCooldowns(player) {
    if (!player || !player.skillSystem || !this.skillCooldown) return;

    // SkillSystem의 skills Map을 전달
    this.skillCooldown.updateFromSkills(player.skillSystem.skills);
  }

  /**
   * 저장된 쿨타임 복원 (캐릭터 전환 시)
   * @param {string} characterType
   * @param {Object} player - 현재 플레이어 객체
   */
  async restoreSkillCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;

    const savedCooldowns = await SaveManager.getSkillCooldowns(characterType);

    if (Object.keys(savedCooldowns).length > 0) {
      // SkillSystem의 Skill 객체에 쿨타임 복원
      this.skillCooldown.restoreCooldowns(savedCooldowns, player.skillSystem.skills);
      console.log(`♻️ ${characterType} 스킬 쿨타임 복원:`, savedCooldowns);
    }

    // 만료된 쿨타임 정리
    await SaveManager.cleanExpiredCooldowns(characterType);
  }

  /**
   * 현재 쿨타임 저장 (캐릭터 전환 전)
   * @param {string} characterType
   * @param {Object} player - 현재 플레이어 객체
   */
  async saveCurrentCooldowns(characterType, player) {
    if (!this.skillCooldown || !player || !player.skillSystem) return;

    // SkillSystem으로부터 현재 쿨타임 가져오기
    const cooldowns = this.skillCooldown.getCurrentCooldowns(player.skillSystem.skills);

    if (Object.keys(cooldowns).length > 0) {
      await SaveManager.saveAllSkillCooldowns(characterType, cooldowns);
      console.log(`💾 ${characterType} 스킬 쿨타임 저장:`, cooldowns);
    }
  }

  /**
   * 경험치 바 업데이트
   */
  async updateExpBar() {
    const expData = await SaveManager.getExpData();
    const totalExp = expData.totalExp || 0;

    // 레벨 계산 (100 경험치당 1레벨)
    const level = Math.floor(totalExp / 100) + 1;
    const currentLevelExp = totalExp % 100;
    const nextLevelExp = 100;

    // ExpBar 업데이트
    if (this.expBar) {
      this.expBar.update(currentLevelExp, nextLevelExp);
    }

    // 텍스트 업데이트
    if (this.expText) {
      this.expText.setText(
        `Lv.${level} | EXP: ${currentLevelExp}/${nextLevelExp} (Total: ${totalExp})`,
      );
    }
  }

  /**
   * 캐릭터별 경험치 통계 업데이트
   */
  async updateCharacterStats() {
    if (this.characterStats) {
      await this.characterStats.refresh();
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

      // 3초 후 원래 색으로 복구
      this.time.delayedCall(3000, () => {
        if (this.logText) {
          this.logText.setStyle({ fill: '#cccccc' });
        }
      });
    }
  }
}
