import SkillIconLoader from '../utils/SkillIconLoader.js';

export default class UISkillCooldown {
  constructor(scene, centerX, bottomY) {
    this.scene = scene;
    this.unlockSystem = null;

    const slotSize = 64;
    const gap = 8;
    const totalWidth = (slotSize + gap) * 6 - gap;
    const startX = centerX - totalWidth / 2;

    this.container = scene.add.container(startX, bottomY).setScrollFactor(0).setDepth(2000);

    this.skillSlots = {};
    this.skillKeys = ['Q', 'W', 'E', 'R', 'S', 'A'];

    this.skillKeys.forEach((key, index) => {
      const xPos = index * (slotSize + gap);

      // 슬롯 배경
      const bg = scene.add
        .image(xPos + slotSize / 2, slotSize / 2, 'ui_skill', 78)
        .setDisplaySize(slotSize, slotSize);

      // 기본 원형 아이콘
      const icon = scene.add
        .circle(xPos + slotSize / 2, slotSize / 2, 20, this.getSkillColor(key), 0.6)
        .setData('isEmpty', true);

      // 쿨타임 오버레이
      const cooldownOverlay = scene.add.graphics();

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
        .setVisible(false);

      // 시전 중 표시용 서클
      const castingCircle = scene.add
        .graphics()
        .setVisible(false)
        .setPosition(slotSize / 4, slotSize / 4);

      // 키 배지
      const keyBadge = scene.add.graphics();
      keyBadge.fillStyle(0x000000, 0.8);
      keyBadge.fillRoundedRect(xPos + 4, 4, 20, 20, 4);
      keyBadge.lineStyle(1, 0xffffff, 0.5);
      keyBadge.strokeRoundedRect(xPos + 4, 4, 20, 20, 4);

      const keyText = scene.add
        .text(xPos + 12, 16, key, {
          fontSize: '24px',
          color: '#ff6b6b',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(1);

      // ✅ 잠금 오버레이
      const lockOverlay = scene.add
        .rectangle(xPos + slotSize / 2, slotSize / 2, slotSize - 4, slotSize - 4, 0x000000, 0.85)
        .setVisible(false);

      const lockIcon = scene.add
        .text(xPos + slotSize / 2, slotSize / 2, '🔒', {
          fontSize: '32px',
        })
        .setOrigin(0.5)
        .setVisible(false);

      // 호버 툴팁
      const tooltip = scene.add
        .container(xPos + slotSize / 2, -10)
        .setDepth(3000)
        .setVisible(false);

      const tooltipBg = scene.add
        .rectangle(0, 0, 180, 50, 0x000000, 0.95)
        .setStrokeStyle(2, 0xff6b6b);

      const tooltipText = scene.add
        .text(0, 0, '', {
          fontSize: '16px',
          color: '#FFD700',
          fontFamily: 'Arial',
          align: 'center',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      tooltip.add([tooltipBg, tooltipText]);

      // 인터랙티브 영역
      const hitArea = scene.add
        .rectangle(xPos + slotSize / 2, slotSize / 2, slotSize, slotSize, 0x000000, 0)
        .setInteractive();

      hitArea.on('pointerover', () => {
        if (this.unlockSystem) {
          const isUnlocked = this.unlockSystem.isSkillUnlocked(key);

          if (!isUnlocked) {
            const requiredLevel = this.unlockSystem.getRequiredLevel(key);
            tooltipText.setText(`요구 조건:\n${requiredLevel}레벨 이상`);
            tooltip.setVisible(true);
          }
        }
      });

      hitArea.on('pointerout', () => {
        tooltip.setVisible(false);
      });

      this.skillSlots[key] = {
        bg,
        icon,
        keyBadge,
        keyText,
        cooldownOverlay,
        cooldownText,
        castingCircle,
        lockOverlay,
        lockIcon,
        tooltip,
        tooltipText,
        hitArea,
        slotSize,
        xPos,
      };

      // Container 추가 순서
      this.container.add([
        bg,
        icon,
        cooldownOverlay,
        castingCircle,
        cooldownText,
        keyBadge,
        keyText,
        lockOverlay, // 잠금 오버레이는 위쪽에
        lockIcon,
        tooltip,
        hitArea,
      ]);
    });
  }

  setUnlockSystem(unlockSystem) {
    this.unlockSystem = unlockSystem;
    this.updateLockStates();
  }

  updateLockStates() {
    if (!this.unlockSystem) return;

    this.skillKeys.forEach((key) => {
      const slot = this.skillSlots[key];
      const isUnlocked = this.unlockSystem.isSkillUnlocked(key);

      if (!isUnlocked) {
        // 잠금 상태
        slot.lockOverlay.setVisible(true);
        slot.lockIcon.setVisible(true);

        if (slot.iconImage) {
          slot.iconImage.setAlpha(0.3);
          slot.iconImage.setTint(0x666666);
        } else {
          slot.icon.setAlpha(0.3);
          // ✅ Circle 객체는 setFillStyle 사용
          slot.icon.setFillStyle(0x666666, 0.3);
        }
      } else {
        // 잠금 해제 상태
        slot.lockOverlay.setVisible(false);
        slot.lockIcon.setVisible(false);

        if (slot.iconImage) {
          slot.iconImage.setAlpha(0.9);
          slot.iconImage.clearTint();
        } else {
          slot.icon.setAlpha(0.6);
          // ✅ 원래 색상으로 복원
          slot.icon.setFillStyle(this.getSkillColor(key), 0.6);
        }
      }
    });
  }

  /**
   * ✅ 스킬이 사용 가능한지 확인 (외부에서 호출)
   */
  canUseSkill(skillKey) {
    if (!this.unlockSystem) return true; // 시스템 없으면 허용
    return this.unlockSystem.isSkillUnlocked(skillKey);
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

    this.updateLockStates();
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
      // ✅ 1. 잠금 체크 최우선 (더 안전한 체크)
      if (this.unlockSystem) {
        const isUnlocked = this.unlockSystem.isSkillUnlocked(uiKey);

        if (!isUnlocked) {
          this.showLocked(slot);
          return; // ✅ 잠긴 스킬은 여기서 종료
        } else {
          // ✅ 잠금 해제된 스킬은 잠금 오버레이 숨김
          slot.lockOverlay.setVisible(false);
          slot.lockIcon.setVisible(false);
        }
      }

      // ✅ 2. 스킬 데이터 확인
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

      if (!foundSkill) {
        this.resetSlotVisuals(slot);
        return;
      }

      const manaForSkill = foundSkill?.config?.cost?.mana;

      // 스킬 시전 중
      if (foundSkill.isActive) {
        this.showCasting(slot);
      }
      // 쿨타임 중
      else if (foundSkill.cooldownRemaining > 0) {
        const totalCooldown = foundSkill.config?.cooldown || foundSkill.cooldownRemaining;
        const progress = foundSkill.cooldownRemaining / totalCooldown;
        this.showCooldown(slot, foundSkill.cooldownRemaining, progress);
      }
      // 힐 스킬 사용 불가
      else if (this.isHealingSkillUnusable(character, foundSkill.config)) {
        this.showCasting(slot);
        return;
      }
      // 준비 완료
      else {
        this.resetSlotVisuals(slot);
      }

      // 마나 부족
      if (manaForSkill && manaForSkill > character.mana) {
        this.showCasting(slot);
      }
    });
  }

  showLocked(slot) {
    // ✅ 잠금 오버레이 표시
    slot.lockOverlay.setVisible(true);
    slot.lockOverlay.setAlpha(0.85);

    slot.lockIcon.setVisible(true);
    slot.lockIcon.setAlpha(1);

    // 아이콘 어둡게
    if (slot.iconImage) {
      slot.iconImage.setAlpha(0.3);
      slot.iconImage.setTint(0x666666);
    } else {
      slot.icon.setAlpha(0.3);
      // ✅ Circle 객체는 setTint() 대신 setFillStyle() 사용
      slot.icon.setFillStyle(0x666666, 0.3);
    }

    // 다른 오버레이 숨김
    slot.cooldownOverlay.setVisible(false);
    slot.cooldownOverlay.clear();
    slot.cooldownText.setVisible(false);
    slot.castingCircle.setVisible(false);
  }

  isHealingSkillUnusable(character, config) {
    const hasHealAmount = config?.healAmount > 0;
    const hasManaAmount = config?.manaAmount > 0;
    const isHpFull = character.health >= character.maxHealth;
    const isManaFull = character.mana >= character.maxMana;

    if (hasHealAmount && !hasManaAmount && isHpFull) return true;
    if (hasManaAmount && !hasHealAmount && isManaFull) return true;
    if (hasHealAmount && hasManaAmount && isHpFull && isManaFull) return true;

    return false;
  }

  showCasting(slot) {
    if (slot.iconImage) slot.iconImage.setAlpha(0.5);
    else slot.icon.setAlpha(0.5);

    slot.cooldownOverlay.setVisible(false);
    slot.cooldownText.setVisible(false);
    slot.lockOverlay.setVisible(false);
    slot.lockIcon.setVisible(false);
  }

  showCooldown(slot, cooldownMs, progress) {
    if (slot.iconImage) slot.iconImage.setAlpha(0.3);
    else slot.icon.setAlpha(0.3);

    slot.castingCircle.setVisible(false);
    slot.cooldownText.setVisible(true).setText(Math.ceil(cooldownMs / 1000));

    slot.cooldownOverlay.clear();
    slot.cooldownOverlay.fillStyle(0x000000, 0.7);

    const totalHeight = slot.slotSize - 10;
    const currentHeight = totalHeight * (1 - progress);

    slot.cooldownOverlay.fillRoundedRect(slot.xPos + 5, 5, slot.slotSize - 10, currentHeight, 8);
    slot.cooldownOverlay.setVisible(true);

    // 쿨타임 중에는 잠금 오버레이 숨김
    slot.lockOverlay.setVisible(false);
    slot.lockIcon.setVisible(false);
  }

  resetSlotVisuals(slot) {
    slot.cooldownOverlay.setVisible(false);
    slot.cooldownOverlay.clear();
    slot.cooldownText.setVisible(false);
    slot.castingCircle.setVisible(false);
    slot.lockOverlay.setVisible(false);
    slot.lockIcon.setVisible(false);

    if (slot.iconImage) {
      slot.iconImage.setAlpha(0.9);
      slot.iconImage.clearTint();
    } else {
      slot.icon.setAlpha(0.6);
    }
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
