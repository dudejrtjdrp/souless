import { CharacterData } from '../config/characterData';

export default class SkillIconLoader {
  /**
   * scene: Phaser.Scene
   * 캐릭터 데이터 기반으로 모든 스킬 아이콘 preload
   */
  static preload(scene) {
    Object.entries(CharacterData).forEach(([charKey, charData]) => {
      if (!charData.skills) return;

      Object.entries(charData.skills).forEach(([skillKey, skill]) => {
        if (skill.icon) {
          const textureKey = SkillIconLoader.getTextureKey(charKey, skillKey);
          // 중복 등록 방지
          if (!scene.textures.exists(textureKey)) {
            scene.load.image(textureKey, skill.icon);
          }
        }
      });
    });
  }

  /**
   * 캐릭터+스킬 키로 Phaser 텍스처 키 생성
   */
  static getTextureKey(characterKey, skillKey) {
    return `skill_icon_${characterKey}_${skillKey}`;
  }

  /**
   * UISkillCooldown에서 사용할 스킬 아이콘 불러오기
   * @param {Phaser.Scene} scene - Phaser Scene
   * @param {Object} slot - UISkillCooldown.skillSlots[key]
   * @param {string} characterKey - 'warrior', 'mage' etc
   * @param {string} skillKey - 'q_skill', 'attack' etc
   */
  static applyIcon(scene, slot, characterKey, skillKey) {
    const textureKey = SkillIconLoader.getTextureKey(characterKey, skillKey);

    if (!slot) return;

    // 기존 아이콘 이미지 제거
    if (slot.iconImage) {
      slot.iconImage.destroy();
      slot.iconImage = null;
    }

    // 텍스처가 존재하면 이미지로 교체
    if (scene.textures.exists(textureKey)) {
      slot.icon.setVisible(false);
      slot.icon.setData('isEmpty', false);

      // ✅ xPos 기준으로 중앙 계산
      const iconImage = scene.add
        .image(slot.xPos + slot.slotSize / 2, slot.slotSize / 2, textureKey)
        .setDisplaySize(48, 48)
        .setAlpha(0.9);

      slot.iconImage = iconImage;

      // container에 추가
      if (slot.bg && slot.bg.parentContainer) {
        slot.bg.parentContainer.add(iconImage);
      }
    } else {
      // 텍스처가 없으면 기본 원형 아이콘 표시
      slot.icon.setVisible(true);
      slot.icon.setData('isEmpty', true);
    }
  }

  /**
   * 캐릭터 전환 시 전체 스킬 슬롯 아이콘 업데이트
   * @param {Phaser.Scene} scene
   * @param {UISkillCooldown} uiSkillCooldown
   * @param {string} characterType - 'warrior', 'mage' etc
   */
  static updateAllIcons(scene, uiSkillCooldown, characterType) {
    const characterData = CharacterData[characterType];
    if (!characterData || !characterData.skills) return;

    // UI 키 매핑 (Q, W, E, R, S, A)
    const skillMapping = {
      Q: ['q_skill', 'dash'],
      W: ['w_skill'],
      E: ['e_skill'],
      R: ['r_skill'],
      S: ['s_skill'],
      A: ['attack', 'basic_attack', 'melee_attack'],
    };

    // 각 슬롯별로 아이콘 적용
    Object.entries(skillMapping).forEach(([uiKey, possibleNames]) => {
      const slot = uiSkillCooldown.skillSlots[uiKey];
      if (!slot) return;

      // 해당하는 스킬 찾기
      let foundSkillKey = null;
      for (const skillName of possibleNames) {
        if (characterData.skills[skillName]) {
          foundSkillKey = skillName;
          break;
        }
      }

      // 아이콘 적용
      if (foundSkillKey) {
        SkillIconLoader.applyIcon(scene, slot, characterType, foundSkillKey);
      } else {
        // 스킬이 없으면 기본 아이콘으로
        SkillIconLoader.resetIcon(slot);
      }
    });
  }

  /**
   * 기본 아이콘으로 리셋
   */
  static resetIcon(slot) {
    if (!slot) return;

    if (slot.iconImage) {
      slot.iconImage.destroy();
      slot.iconImage = null;
    }

    slot.icon.setVisible(true);
    slot.icon.setData('isEmpty', true);
  }
}
