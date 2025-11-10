// ui/UISkillCooldown.js
export default class UISkillCooldown {
  constructor(scene, centerX, bottomY) {
    this.scene = scene;

    // 화면 중앙 하단 배치
    const slotSize = 64;
    const gap = 8;
    const totalWidth = (slotSize + gap) * 6 - gap;
    const startX = centerX - totalWidth / 2;

    this.container = scene.add.container(startX, bottomY).setScrollFactor(0).setDepth(1000);

    this.skillSlots = {};
    this.skillKeys = ['Q', 'W', 'E', 'R', 'S', 'A'];

    this.skillKeys.forEach((key, index) => {
      const xPos = index * (slotSize + gap);

      // 슬롯 배경 (그라디언트 효과)
      const bg = scene.add.graphics();
      bg.fillStyle(0x2a2a2a, 1);
      bg.fillRoundedRect(xPos, 0, slotSize, slotSize, 8);
      bg.lineStyle(2, 0x444444, 1);
      bg.strokeRoundedRect(xPos, 0, slotSize, slotSize, 8);

      // 스킬 아이콘 (빈 원 - 나중에 실제 스킬 아이콘으로 교체됨)
      const icon = scene.add.circle(
        xPos + slotSize / 2,
        slotSize / 2,
        20,
        this.getSkillColor(key),
        0.6,
      );
      icon.setData('isEmpty', true); // 기본 아이콘 표시

      // 스킬 키 텍스트 (작은 배지 형태)
      const keyBadge = scene.add.graphics();
      keyBadge.fillStyle(0x000000, 0.8);
      keyBadge.fillRoundedRect(xPos + 4, 4, 20, 20, 4);
      keyBadge.lineStyle(1, 0xffffff, 0.5);
      keyBadge.strokeRoundedRect(xPos + 4, 4, 20, 20, 4);

      const keyText = scene.add
        .text(xPos + 14, 14, key, {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);

      // 쿨타임 오버레이
      const cooldownOverlay = scene.add.graphics();
      cooldownOverlay.fillStyle(0x000000, 0.75);
      cooldownOverlay.fillRoundedRect(xPos, 0, slotSize, slotSize, 8);
      cooldownOverlay.setVisible(false);

      // 쿨타임 텍스트 (큰 글씨)
      const cooldownText = scene.add
        .text(xPos + slotSize / 2, slotSize / 2, '', {
          fontSize: '24px',
          color: '#ff6b6b',
          fontStyle: 'bold',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setVisible(false);

      // 쿨타임 진행 원형 게이지
      const cooldownCircle = scene.add.graphics();
      cooldownCircle.setVisible(false);

      this.skillSlots[key] = {
        bg,
        icon,
        keyBadge,
        keyText,
        cooldownOverlay,
        cooldownText,
        cooldownCircle,
        maxCooldown: 0,
        xPos, // 아이콘 위치 저장
        slotSize,
      };

      this.container.add([
        bg,
        icon,
        keyBadge,
        keyText,
        cooldownOverlay,
        cooldownText,
        cooldownCircle,
      ]);
    });
  }

  getSkillColor(key) {
    const colors = {
      Q: 0xff6b6b,
      W: 0x4dabf7,
      E: 0x51cf66,
      R: 0xffd43b,
      S: 0xda77f2,
      A: 0xff922b,
    };
    return colors[key] || 0xcccccc;
  }

  /**
   * 캐릭터의 스킬 데이터를 기반으로 아이콘 업데이트
   * @param {Object} characterData - CharacterData에서 가져온 캐릭터 정보
   */
  updateSkillIcons(characterData) {
    if (!characterData || !characterData.skills) return;

    const skillMapping = {
      Q: ['q_skill', 'dash'],
      W: ['w_skill'],
      E: ['e_skill'],
      R: ['r_skill'],
      S: ['s_skill'],
      A: ['attack'],
    };

    Object.entries(skillMapping).forEach(([uiKey, possibleNames]) => {
      const slot = this.skillSlots[uiKey];
      if (!slot) return;

      // 해당하는 스킬 찾기
      let foundSkill = null;
      let skillName = null;
      for (const name of possibleNames) {
        if (characterData.skills[name]) {
          foundSkill = characterData.skills[name];
          skillName = name;
          break;
        }
      }

      // 아이콘 업데이트
      if (foundSkill && foundSkill.icon) {
        this.loadSkillIcon(uiKey, foundSkill.icon, slot);
      } else {
        // 스킬이 없으면 기본 원 표시
        this.resetToDefaultIcon(slot, uiKey);
      }
    });
  }

  /**
   * 스킬 아이콘 로드 및 교체
   */
  loadSkillIcon(key, iconPath, slot) {
    const iconKey = `skill_icon_${key}`;

    // 이미 로드된 아이콘이면 바로 사용
    if (this.scene.textures.exists(iconKey)) {
      this.replaceIcon(slot, iconKey);
      return;
    }

    // 새로운 아이콘 로드
    this.scene.load.image(iconKey, iconPath);
    this.scene.load.once('complete', () => {
      this.replaceIcon(slot, iconKey);
    });
    this.scene.load.start();
  }

  /**
   * 아이콘 교체
   */
  replaceIcon(slot, textureKey) {
    if (!slot.icon) return;

    // 기존 아이콘 제거
    if (slot.iconImage) {
      slot.iconImage.destroy();
      slot.iconImage = null;
    }
    if (slot.icon && !slot.icon.getData('isEmpty')) {
      slot.icon.destroy();
    }

    // 새 이미지 아이콘 생성
    const iconImage = this.scene.add
      .image(slot.xPos + slot.slotSize / 2, slot.slotSize / 2, textureKey)
      .setDisplaySize(48, 48)
      .setAlpha(0.9);

    slot.iconImage = iconImage;
    slot.icon.setVisible(false); // 기본 원 숨김
    this.container.add(iconImage);
  }

  /**
   * 기본 아이콘으로 복구
   */
  resetToDefaultIcon(slot, key) {
    if (slot.iconImage) {
      slot.iconImage.destroy();
      slot.iconImage = null;
    }
    slot.icon.setVisible(true);
    slot.icon.setData('isEmpty', true);
  }

  updateFromSkills(skillsMap) {
    if (!skillsMap) return;

    const skillMapping = {
      Q: ['q_skill', 'dash'],
      W: ['w_skill'],
      E: ['e_skill'],
      R: ['r_skill'],
      S: ['s_skill'],
      A: ['attack', 'basic_attack', 'melee_attack'],
    };

    Object.entries(skillMapping).forEach(([uiKey, possibleNames]) => {
      const slot = this.skillSlots[uiKey];
      if (!slot) return;

      let foundSkill = null;
      for (const skillName of possibleNames) {
        const skill = skillsMap.get(skillName);
        if (skill) {
          foundSkill = skill;
          break;
        }
      }

      if (foundSkill && foundSkill.cooldownRemaining > 0) {
        const remainingSec = Math.ceil(foundSkill.cooldownRemaining / 1000);

        // 쿨타임 진행률 계산
        if (!slot.maxCooldown || foundSkill.cooldownRemaining > slot.maxCooldown) {
          slot.maxCooldown = foundSkill.cooldownRemaining;
        }
        const progress = foundSkill.cooldownRemaining / slot.maxCooldown;

        // 오버레이 표시
        slot.cooldownOverlay.setVisible(true);
        slot.cooldownText.setVisible(true);
        slot.cooldownText.setText(`${remainingSec}`);

        // 원형 게이지 그리기
        slot.cooldownCircle.clear();
        slot.cooldownCircle.lineStyle(3, 0xff6b6b, 0.8);
        const angle = Phaser.Math.PI2 * (1 - progress);
        const centerX = slot.keyText.x;
        const centerY = slot.keyText.y;
        slot.cooldownCircle.beginPath();
        slot.cooldownCircle.arc(centerX, centerY, 28, -Math.PI / 2, -Math.PI / 2 + angle, false);
        slot.cooldownCircle.strokePath();
        slot.cooldownCircle.setVisible(true);

        // 아이콘 어둡게
        if (slot.iconImage) {
          slot.iconImage.setAlpha(0.3);
        } else if (slot.icon.setAlpha) {
          slot.icon.setAlpha(0.3);
        }
      } else {
        // 쿨타임 종료
        slot.cooldownOverlay.setVisible(false);
        slot.cooldownText.setVisible(false);
        slot.cooldownCircle.setVisible(false);
        slot.maxCooldown = 0;

        // 아이콘 밝게
        if (slot.iconImage) {
          slot.iconImage.setAlpha(0.9);
        } else if (slot.icon.setAlpha) {
          slot.icon.setAlpha(0.6);
        }
      }
    });
  }

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

  restoreCooldowns(cooldowns, skillsMap) {
    if (!cooldowns || !skillsMap) return;
    for (const [skillName, remainingMs] of Object.entries(cooldowns)) {
      const skill = skillsMap.get(skillName);
      if (skill && remainingMs > 0) {
        skill.cooldownRemaining = remainingMs;
      }
    }
  }

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
