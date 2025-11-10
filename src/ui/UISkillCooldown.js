// ui/UISkillCooldown.js
export default class UISkillCooldown {
  constructor(scene, x = 20, y = 320) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setScrollFactor(0).setDepth(1000);

    // 스킬 슬롯들 (최대 6개: Q, W, E, R, S, A)
    this.skillSlots = {};
    this.skillKeys = ['Q', 'W', 'E', 'R', 'S', 'A'];

    const slotSize = 50;
    const gap = 10;

    this.skillKeys.forEach((key, index) => {
      const xPos = index * (slotSize + gap);

      // 슬롯 배경
      const bg = scene.add.rectangle(xPos, 0, slotSize, slotSize, 0x333333, 0.8).setOrigin(0);

      // 스킬 키 텍스트
      const keyText = scene.add
        .text(xPos + slotSize / 2, 5, key, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0);

      // 쿨타임 오버레이 (어두운 반투명)
      const cooldownOverlay = scene.add
        .rectangle(xPos, 0, slotSize, slotSize, 0x000000, 0.7)
        .setOrigin(0)
        .setVisible(false);

      // 쿨타임 텍스트
      const cooldownText = scene.add
        .text(xPos + slotSize / 2, slotSize / 2 + 5, '', {
          fontSize: '16px',
          color: '#ff4d4d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setVisible(false);

      this.skillSlots[key] = {
        bg,
        keyText,
        cooldownOverlay,
        cooldownText,
      };

      this.container.add([bg, keyText, cooldownOverlay, cooldownText]);
    });
  }

  /**
   * 스킬 객체로부터 쿨타임 업데이트 (매 프레임)
   * @param {Map} skillsMap - SkillSystem의 skills Map
   */
  updateFromSkills(skillsMap) {
    if (!skillsMap) return;

    // 스킬 이름과 UI 키 매핑
    const skillMapping = {
      Q: ['attack_2', 'q_skill', 'dash', 'teleport'],
      W: ['attack_3', 'w_skill', 'fireball', 'ice_shard'],
      E: ['defend', 'e_skill', 'meditation', 'heal'],
      R: ['special_attack', 'r_skill', 'ultimate', 'special'],
      S: ['roll', 's_skill', 'support', 'buff'],
      A: ['attack', 'basic_attack', 'melee_attack'],
    };

    // 각 UI 슬롯 업데이트
    Object.entries(skillMapping).forEach(([uiKey, possibleNames]) => {
      const slot = this.skillSlots[uiKey];
      if (!slot) return;

      // 가능한 스킬 이름 중 하나라도 매칭되면
      let foundSkill = null;
      for (const skillName of possibleNames) {
        const skill = skillsMap.get(skillName);
        if (skill) {
          foundSkill = skill;
          break;
        }
      }

      if (foundSkill && foundSkill.cooldownRemaining > 0) {
        // 쿨타임 중
        slot.cooldownOverlay.setVisible(true);
        slot.cooldownText.setVisible(true);

        // 남은 시간을 초 단위로 표시
        const remainingSec = Math.ceil(foundSkill.cooldownRemaining / 1000);
        slot.cooldownText.setText(`${remainingSec}s`);
      } else {
        // 쿨타임 종료
        slot.cooldownOverlay.setVisible(false);
        slot.cooldownText.setVisible(false);
      }
    });
  }

  /**
   * 현재 쿨타임 상태 가져오기 (저장용)
   * @param {Map} skillsMap - SkillSystem의 skills Map
   * @returns {Object} { skill_name: remainingMs, ... }
   */
  getCurrentCooldowns(skillsMap) {
    if (!skillsMap) return {};

    const cooldowns = {};

    for (const [skillName, skill] of skillsMap.entries()) {
      if (skill.cooldownRemaining > 0) {
        cooldowns[skillName] = skill.cooldownRemaining;
      }
    }

    return cooldowns;
  }

  /**
   * 저장된 쿨타임 복원 (캐릭터 전환 시)
   * @param {Object} cooldowns - { skill_name: remainingMs, ... }
   * @param {Map} skillsMap - SkillSystem의 skills Map
   */
  restoreCooldowns(cooldowns, skillsMap) {
    if (!cooldowns || !skillsMap) return;

    for (const [skillName, remainingMs] of Object.entries(cooldowns)) {
      const skill = skillsMap.get(skillName);
      if (skill && remainingMs > 0) {
        skill.cooldownRemaining = remainingMs;
      }
    }
  }

  /**
   * 특정 스킬의 쿨타임 확인
   * @param {string} skillName - 스킬 이름 (예: 'skill_q', 'dash')
   * @param {Map} skillsMap - SkillSystem의 skills Map
   * @returns {boolean} true면 쿨타임 중
   */
  isOnCooldown(skillName, skillsMap) {
    if (!skillsMap) return false;

    const skill = skillsMap.get(skillName);
    if (!skill) return false;

    return skill.cooldownRemaining > 0;
  }

  hide() {
    this.container.setVisible(false);
  }

  show() {
    this.container.setVisible(true);
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
  }
}
