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

      // 쿨타임 오버레이
      const cooldownOverlay = scene.add.graphics().setDepth(2002);
      // cooldownOverlay.fillStyle(0x000000, 1);
      // cooldownOverlay.fillRoundedRect(slotSize / 6, slotSize / 6, slotSize - 10, slotSize - 10, 8);
      // cooldownOverlay.setVisible(false);

      const cooldownText = scene.add
        .text(xPos + slotSize / 2, slotSize / 2, '', {
          fontSize: '24px',
          color: '#ff6b6b',
          fontStyle: 'bold',
          fontFamily: 'RoundedFixedsys',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(2004);

      const cooldownCircle = scene.add
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
        cooldownCircle,
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
        cooldownCircle,
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

  updateFromSkills(skillsMap) {
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

      if (foundSkill && foundSkill.cooldownRemaining > 0) {
        const progress =
          foundSkill.cooldownRemaining / (slot.maxCooldown || foundSkill.cooldownRemaining);
        slot.maxCooldown = slot.maxCooldown || foundSkill.cooldownRemaining;

        slot.cooldownOverlay.setVisible(true);
        slot.cooldownText.setVisible(true).setText(Math.ceil(foundSkill.cooldownRemaining / 1000));
        slot.cooldownCircle.clear();
        slot.cooldownCircle.lineStyle(3, 0xff6b6b, 0.8);
        slot.cooldownCircle.beginPath();
        slot.cooldownCircle.arc(
          slot.keyText.x + 4,
          slot.keyText.y + 2,
          20,
          -Math.PI / 2,
          -Math.PI / 2 + Phaser.Math.PI2 * (1 - progress),
          false,
        );
        slot.cooldownCircle.strokePath();
        slot.cooldownCircle.setVisible(true);

        if (slot.iconImage) slot.iconImage.setAlpha(0.3);
        else slot.icon.setAlpha(0.3);
      } else {
        slot.cooldownOverlay.setVisible(false);
        slot.cooldownText.setVisible(false);
        slot.cooldownCircle.setVisible(false);
        slot.maxCooldown = 0;
        if (slot.iconImage) slot.iconImage.setAlpha(0.9);
        else slot.icon.setAlpha(0.6);
      }
    });
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
