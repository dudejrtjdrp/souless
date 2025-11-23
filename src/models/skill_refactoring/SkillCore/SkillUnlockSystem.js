// SkillUnlockSystem.js

export default class SkillUnlockSystem {
  constructor(scene, levelSystem, characterType) {
    this.scene = scene;
    this.levelSystem = levelSystem;
    this.currentCharacterType = characterType;
    this.previousLevel = 0;

    // 스킬별 요구 레벨 (캐릭터 레벨 기준)
    this.requiredLevels = {
      Q: 10,
      W: 20,
      E: 30,
      R: 40,
      S: 1, // 처음부터 사용 가능
      A: 1, // 기본 공격은 처음부터 사용 가능
    };

    // ✅ 초기 레벨 설정
    if (characterType && levelSystem) {
      this.previousLevel = this.getCharacterLevel(characterType);
    }
  }

  /**
   * ✅ 레벨 업데이트 메서드 추가
   */
  updateLevel(newLevel) {
    if (newLevel !== this.previousLevel) {
      console.log(`📊 레벨 업데이트: ${this.previousLevel} → ${newLevel}`);
      this.onLevelUp(newLevel);
      this.previousLevel = newLevel;
    }
  }

  /**
   * 현재 캐릭터 타입 설정
   */
  setCurrentCharacter(characterType, currentLevel = null) {
    this.currentCharacterType = characterType;

    if (currentLevel !== null) {
      this.previousLevel = currentLevel;
    } else {
      this.previousLevel = this.getCharacterLevel(characterType);
    }

    // ✅ 즉시 잠금 상태 업데이트
    if (this.scene) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene?.skillCooldown) {
        uiScene.skillCooldown.updateLockStates();
      }
    }
  }

  /**
   * setCharacterType은 setCurrentCharacter의 별칭
   */
  setCharacterType(characterType, currentLevel = null) {
    this.setCurrentCharacter(characterType, currentLevel);
  }

  /**
   * 캐릭터의 현재 레벨 가져오기
   */
  getCharacterLevel(characterType = null) {
    const charType = characterType || this.currentCharacterType;

    if (!charType) {
      console.warn('⚠️ characterType이 없음, 기본값 1 반환');
      return 1;
    }

    try {
      // ✅ LevelSystem에서 직접 레벨 가져오기
      if (this.levelSystem) {
        const level = this.levelSystem.getCharacterLevel(charType);
        if (level && level > 0) {
          return level;
        }
      }

      // ✅ Scene의 levelSystem에서 가져오기 (fallback)
      if (this.scene?.levelSystem) {
        const level = this.scene.levelSystem.getCharacterLevel(charType);
        if (level && level > 0) {
          return level;
        }
      }

      console.warn(`⚠️ ${charType}의 레벨을 찾을 수 없음, 기본값 1 반환`);
      return 1;
    } catch (error) {
      console.error('Failed to get character level:', error);
      return 1;
    }
  }

  /**
   * 특정 스킬이 잠금 해제되었는지 확인
   */
  isSkillUnlocked(skillKey) {
    if (!this.currentCharacterType) {
      console.warn('⚠️ currentCharacterType이 설정되지 않음');
      return false;
    }

    const requiredLevel = this.requiredLevels[skillKey];
    if (requiredLevel === undefined) {
      console.warn(`⚠️ ${skillKey}의 요구 레벨이 정의되지 않음`);
      return false;
    }

    const characterLevel = this.getCharacterLevel(this.currentCharacterType);
    const isUnlocked = characterLevel >= requiredLevel;

    return isUnlocked;
  }

  /**
   * 스킬의 요구 레벨 반환
   */
  getRequiredLevel(skillKey) {
    return this.requiredLevels[skillKey] || 1;
  }

  /**
   * 모든 스킬의 잠금 상태 반환
   */
  getAllUnlockStates() {
    const states = {};
    Object.keys(this.requiredLevels).forEach((skillKey) => {
      states[skillKey] = this.isSkillUnlocked(skillKey);
    });
    return states;
  }

  /**
   * update 메서드 (GameScene의 update에서 호출)
   * 레벨업 시 새로 해금된 스킬 체크
   */
  update(time, delta) {
    if (!this.currentCharacterType) return;

    const currentLevel = this.getCharacterLevel(this.currentCharacterType);

    // 레벨이 올랐을 때만 체크
    if (currentLevel > this.previousLevel) {
      this.onLevelUp(currentLevel);
      this.previousLevel = currentLevel;
    }
  }

  /**
   * 레벨업 시 처리
   */
  onLevelUp(newLevel) {
    console.log(`🎉 레벨업 감지: Lv.${newLevel}`);

    // 새로 해금된 스킬 체크
    const newlyUnlocked = [];

    Object.entries(this.requiredLevels).forEach(([skillKey, reqLevel]) => {
      if (newLevel === reqLevel) {
        newlyUnlocked.push(skillKey);
      }
    });

    // ✅ 레벨업 시 무조건 UI 업데이트 (새로 해금된 스킬이 없어도)
    if (this.scene) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene?.skillCooldown) {
        console.log('✅ UI 스킬 잠금 상태 업데이트');
        uiScene.skillCooldown.updateLockStates();

        // ✅ 스킬 쿨다운도 함께 업데이트
        const player = this.scene.player;
        if (player?.skillSystem) {
          uiScene.skillCooldown.updateFromSkills(player, player.skillSystem.skills);
        }
      }
    }
  }

  /**
   * 정리
   */
  destroy() {
    this.scene = null;
    this.levelSystem = null;
    this.currentCharacterType = null;
  }
}
