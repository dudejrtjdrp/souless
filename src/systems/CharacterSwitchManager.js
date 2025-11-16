import CharacterFactory from '../characters/base/CharacterFactory';

export default class CharacterSwitchManager {
  constructor(scene) {
    this.scene = scene;
    this.characterStates = new Map();
    this.availableCharacters = CharacterFactory.getAvailableTypes();
    this.currentCharacterType = null;
    this.isTransitioning = false;

    // 🆕 현재 맵 정보
    this.currentMapKey = null;
  }

  /**
   * 현재 맵 설정
   */
  setCurrentMap(mapKey) {
    this.currentMapKey = mapKey;
  }

  /**
   * 현재 캐릭터 상태 저장
   */
  saveCurrentCharacterState(character, saveType = 'switch') {
    if (!character || !this.currentCharacterType || !this.currentMapKey) return;

    const state = {
      type: this.currentCharacterType,
      mapKey: this.currentMapKey,
      saveType: saveType, // 'switch' | 'portal'
      position: {
        x: character.sprite.x,
        y: character.sprite.y,
      },
      health: character.health,
      maxHealth: character.maxHealth,
      mana: character.mana,
      maxMana: character.maxMana,
      velocity: {
        x: character.sprite.body.velocity.x,
        y: character.sprite.body.velocity.y,
      },
      facingRight: !character.sprite.flipX,
      isInvincible: character.isInvincible,
      timestamp: this.scene.time.now,
    };

    // 스킬 쿨타임 저장
    if (character.skillSystem) {
      state.skillCooldowns = {};
      character.skillSystem.skills.forEach((skill, key) => {
        state.skillCooldowns[key] = {
          isOnCooldown: skill.isOnCooldown,
          cooldownRemaining: skill.cooldownRemaining,
          lastUsedTime: skill.lastUsedTime,
        };
      });
    }

    // 맵별 + 캐릭터별로 저장
    const stateKey = `${this.currentMapKey}_${this.currentCharacterType}`;
    this.characterStates.set(stateKey, state);
  }

  /**
   * 저장된 캐릭터 상태 불러오기
   */
  loadCharacterState(characterType, mapKey) {
    const stateKey = `${mapKey}_${characterType}`;
    const state = this.characterStates.get(stateKey);

    if (!state) {
      return null;
    }
    return state;
  }

  /**
   * 기본 스폰 위치 생성 (포탈 위치 또는 지정된 위치)
   */
  createDefaultSpawn(mapKey, portalIndex = 0) {
    const mapConfig = this.scene.mapConfig;

    if (!mapConfig || !mapConfig.portals || mapConfig.portals.length === 0) {
      console.warn('No portals found in map config');
      return null;
    }

    const portal = mapConfig.portals[portalIndex];
    if (!portal) {
      console.warn(`Portal index ${portalIndex} not found`);
      return null;
    }

    return {
      x: portal.x,
      y: portal.y - 35, // 포탈 위 오프셋
    };
  }

  /**
   * 캐릭터 스폰 위치 결정
   */
  getSpawnPosition(characterType, mapKey, portalIndex = 0) {
    // 1. 저장된 상태가 있으면 해당 위치 사용
    const savedState = this.loadCharacterState(characterType, mapKey);
    if (savedState && savedState.position) {
      return savedState.position;
    }

    // 2. 저장된 상태가 없으면 포탈 위치 사용
    return this.createDefaultSpawn(mapKey, portalIndex);
  }

  /**
   * 저장된 상태를 캐릭터에 적용
   */
  applyStateToCharacter(character, state) {
    if (!character || !state) return;

    // 체력/마나 복원
    character.health = state.health;
    character.maxHealth = state.maxHealth;
    character.mana = state.mana;
    character.maxMana = state.maxMana;

    // 방향 복원
    character.sprite.setFlipX(!state.facingRight);

    // 무적 상태 복원
    if (state.isInvincible) {
      character.setInvincible(1000);
    }

    // 스킬 쿨타임 복원
    if (character.skillSystem && state.skillCooldowns) {
      const currentTime = this.scene.time.now;
      const elapsedTime = currentTime - state.timestamp;

      character.skillSystem.skills.forEach((skill, key) => {
        const savedCooldown = state.skillCooldowns[key];
        if (savedCooldown && savedCooldown.isOnCooldown) {
          const remainingCooldown = savedCooldown.cooldownRemaining - elapsedTime;

          if (remainingCooldown > 0) {
            skill.isOnCooldown = true;
            skill.cooldownRemaining = remainingCooldown;
            skill.lastUsedTime = currentTime - (skill.cooldown - remainingCooldown);
          } else {
            skill.isOnCooldown = false;
            skill.cooldownRemaining = 0;
          }
        }
      });
    }
  }

  /**
   * 다음 캐릭터로 전환
   */
  switchToNextCharacter() {
    if (!this.currentCharacterType) return null;

    const currentIndex = this.availableCharacters.indexOf(this.currentCharacterType);
    const nextIndex = (currentIndex + 1) % this.availableCharacters.length;
    return this.availableCharacters[nextIndex];
  }

  /**
   * 이전 캐릭터로 전환
   */
  switchToPreviousCharacter() {
    if (!this.currentCharacterType) return null;

    const currentIndex = this.availableCharacters.indexOf(this.currentCharacterType);
    const prevIndex =
      (currentIndex - 1 + this.availableCharacters.length) % this.availableCharacters.length;
    return this.availableCharacters[prevIndex];
  }

  /**
   * 현재 캐릭터 타입 설정
   */
  setCurrentCharacterType(type) {
    this.currentCharacterType = type;
  }

  /**
   * 전환 중 상태 설정
   */
  setTransitioning(value) {
    this.isTransitioning = value;
  }

  /**
   * 특정 맵의 모든 캐릭터 상태 삭제
   */
  clearMapStates(mapKey) {
    const keysToDelete = [];
    this.characterStates.forEach((state, key) => {
      if (key.startsWith(mapKey + '_')) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.characterStates.delete(key));
  }

  /**
   * 모든 저장된 상태 초기화
   */
  resetAllStates() {
    this.characterStates.clear();
  }

  /**
   * 디버그: 모든 저장된 상태 출력
   */
  debugPrintStates() {}
}
