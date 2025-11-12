import SkillIconLoader from '../utils/SkillIconLoader.js';

export default class UISkillCooldown {
  constructor(scene, centerX, bottomY) {
    this.scene = scene;
    const slotSize = 64;
    const gap = 8;
    const totalWidth = (slotSize + gap) * 6 - gap;
    const startX = centerX - totalWidth / 2;

    // 컨테이너: depth 높여서 항상 UI 위
    this.container = scene.add.container(startX, bottomY).setScrollFactor(0).setDepth(2000);

    this.skillSlots = {};
    this.skillKeys = ['Q', 'W', 'E', 'R', 'S', 'A'];

    this.skillKeys.forEach((key, index) => {
      const xPos = index * (slotSize + gap);

      // 슬롯 배경
      const bg = scene.add
        .image(xPos + slotSize / 2, slotSize / 2, 'ui_skill', 78)
        .setDisplaySize(slotSize, slotSize)
        .setDepth(1020);

      // 기본 원형 아이콘
      const icon = scene.add
        .circle(xPos + slotSize / 2, slotSize / 2, 20, this.getSkillColor(key), 0.6)
        .setDepth(2001)
        .setData('isEmpty', true);

      // 키 배지
      const keyBadge = scene.add.graphics();
      keyBadge.fillStyle(0x000000, 0.8);
      keyBadge.fillRoundedRect(xPos + 4, 4, 20, 20, 4);
      keyBadge.lineStyle(1, 0xffffff, 0.5);
      keyBadge.strokeRoundedRect(xPos + 4, 4, 20, 20, 4);
      keyBadge.setDepth(2005);

      const keyText = scene.add
        .text(xPos + 12, 16, key, {
          fontSize: '24px',
          color: '#ff6b6b',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(1)
        .setDepth(2006);

      // 쿨타임 오버레이 (위에서 아래로 내려오는 검은색 사각형)
      const cooldownOverlay = scene.add.graphics().setDepth(2003);

      const cooldownText = scene.add
        .text(xPos + slotSize / 2, slotSize / 2, '', {
          fontSize: '24px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(2004);

      // 시전 중 표시용 서클 (기존 쿨타임 서클)
      const castingCircle = scene.add
        .graphics()
        .setVisible(false)
        .setDepth(2003)
        .setPosition(slotSize / 4, slotSize / 4);

      this.skillSlots[key] = {
        bg,
        icon,
        keyBadge,
        keyText,
        cooldownOverlay,
        cooldownText,
        castingCircle, // 이름 변경
        slotSize,
        xPos,
      };

      this.container.add([
        bg,
        icon,
        keyBadge,
        keyText,
        cooldownOverlay,
        cooldownText,
        castingCircle,
      ]);
    });
  }

  getSkillColor(key) {
    return (
      {
        Q: 0xff6b6b,
        W: 0x4dabf7,
        E: 0x51cf66,
        R: 0xffd43b,
        S: 0xda77f2,
        A: 0xff922b,
      }[key] || 0xcccccc
    );
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

  updateSkillIcons(characterData) {
    if (!characterData?.skills) return;

    const mapping = {
      Q: ['q_skill', 'dash'],
      W: ['w_skill'],
      E: ['e_skill'],
      R: ['r_skill'],
      S: ['s_skill'],
      A: ['attack'],
    };

    Object.entries(mapping).forEach(([uiKey, names]) => {
      const slot = this.skillSlots[uiKey];
      if (!slot) return;

      let foundSkill = null;
      for (const name of names) {
        if (characterData.skills[name]) {
          foundSkill = characterData.skills[name];
          break;
        }
      }

      if (foundSkill?.icon) {
        SkillIconLoader.applyIcon(this.scene, slot, characterData.key, foundSkill.key || names[0]);
      } else {
        this.resetToDefaultIcon(slot);
      }
    });
  }

  resetToDefaultIcon(slot) {
    if (slot.iconImage) {
      slot.iconImage.destroy();
      slot.iconImage = null;
    }
    slot.icon.setVisible(true).setData('isEmpty', true).setAlpha(0.6);
  }

  updateFromSkills(character, skillsMap) {
    if (!skillsMap) return;

    Object.entries(this.skillSlots).forEach(([uiKey, slot]) => {
      const skillNames = {
        Q: ['q_skill', 'dash'],
        W: ['w_skill'],
        E: ['e_skill'],
        R: ['r_skill'],
        S: ['s_skill'],
        A: ['attack'],
      }[uiKey];
      let foundSkill = null;

      for (const name of skillNames) {
        const skill = skillsMap.get(name);
        if (skill) {
          foundSkill = skill;
          break;
        }
      }

      const manaForSkill = foundSkill?.config?.cost?.mana;

      if (!foundSkill) {
        this.resetSlotVisuals(slot);
        return;
      }

      // 1. 스킬 시전 중 (isActive === true)
      if (foundSkill.isActive) {
        this.showCasting(slot);
      }
      // 2. 쿨타임 중 (cooldownRemaining > 0)
      else if (foundSkill.cooldownRemaining > 0) {
        const totalCooldown = foundSkill.config?.cooldown || foundSkill.cooldownRemaining;
        const progress = foundSkill.cooldownRemaining / totalCooldown;
        this.showCooldown(slot, foundSkill.cooldownRemaining, progress);
      }
      // 힐/마나 회복 스킬 사용 불가 체크
      else if (this.isHealingSkillUnusable(character, foundSkill.config)) {
        this.showCasting(slot);
        return;
      }
      // 3. 준비 완료
      else {
        this.resetSlotVisuals(slot);
      }
      if (manaForSkill && manaForSkill > character.mana) {
        this.showCasting(slot);
      }
    });
  }

  isHealingSkillUnusable(character, config) {
    const hasHealAmount = config?.healAmount > 0;
    const hasManaAmount = config?.manaAmount > 0;

    const isHpFull = character.health >= character.maxHealth;
    const isManaFull = character.mana >= character.maxMana;

    // healAmount만 있고 체력이 꽉 찬 경우
    if (hasHealAmount && !hasManaAmount && isHpFull) {
      return true;
    }

    // manaAmount만 있고 마나가 꽉 찬 경우
    if (hasManaAmount && !hasHealAmount && isManaFull) {
      return true;
    }

    // 둘 다 있고 체력과 마나가 모두 꽉 찬 경우
    if (hasHealAmount && hasManaAmount && isHpFull && isManaFull) {
      return true;
    }

    return false;
  }

  showDisabled(slot) {
    // 아이콘 더 어둡게 + 회색조
    if (slot.iconImage) {
      slot.iconImage.setAlpha(0.3);
      slot.iconImage.setTint(0x888888);
    } else {
      slot.icon.setAlpha(0.3);
      slot.icon.setTint(0x888888);
    }

    slot.cooldownOverlay.setVisible(false);
    slot.cooldownText.setVisible(false);
    slot.castingCircle.setVisible(false);
  }

  showCasting(slot) {
    // 아이콘 어둡게 + 시전 중 서클 표시
    if (slot.iconImage) slot.iconImage.setAlpha(0.5);
    else slot.icon.setAlpha(0.5);

    slot.cooldownOverlay.setVisible(false);
    slot.cooldownText.setVisible(false);
  }

  showCooldown(slot, cooldownMs, progress) {
    // 아이콘 어둡게
    if (slot.iconImage) slot.iconImage.setAlpha(0.3);
    else slot.icon.setAlpha(0.3);

    // 시전 중 서클 숨김
    slot.castingCircle.setVisible(false);

    // 쿨타임 텍스트
    slot.cooldownText.setVisible(true).setText(Math.ceil(cooldownMs / 1000));

    // 위에서 아래로 내려오는 검은색 사각형
    slot.cooldownOverlay.clear();
    slot.cooldownOverlay.fillStyle(0x000000, 0.7);

    // progress: 1(쿨타임 시작) → 0(쿨타임 끝)
    // 1-progress: 0(상단) → 1(하단)으로 진행
    const totalHeight = slot.slotSize - 10; // 여백 고려
    const currentHeight = totalHeight * (1 - progress); // 점점 늘어남
    const overlayY = 5; // 상단에서 시작

    slot.cooldownOverlay.fillRoundedRect(
      slot.xPos + 5,
      overlayY,
      slot.slotSize - 10,
      currentHeight,
      8,
    );
    slot.cooldownOverlay.setVisible(true);
  }

  resetSlotVisuals(slot) {
    slot.cooldownOverlay.setVisible(false);
    slot.cooldownText.setVisible(false);
    slot.castingCircle.setVisible(false);

    if (slot.iconImage) slot.iconImage.setAlpha(0.9);
    else slot.icon.setAlpha(0.6);
  }

  hide() {
    this.container.setVisible(false);
  }
  show() {
    this.container.setVisible(true);
  }
  destroy() {
    this.container?.destroy();
  }
}
