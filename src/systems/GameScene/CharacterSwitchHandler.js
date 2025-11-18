export default class CharacterSwitchHandler {
  constructor(scene) {
    this.scene = scene;
  }

  async switchCharacter(direction = 'next') {
    //  수정: 원래 로직으로 복원
    if (this.isTransitioning()) {
      return;
    }

    await this.prepareSwitch();
    const nextType = this.getNextCharacterType(direction);

    if (!nextType) {
      console.error('❌ No next character type found');
      return;
    }

    await this.performSwitch(nextType);
  }

  isTransitioning() {
    return this.scene.characterSwitchManager.isTransitioning;
  }

  async prepareSwitch() {
    await this.scene.saveCurrentPosition();

    //  현재 캐릭터의 체력/마나 저장
    await this.saveCurrentResources();

    await this.saveCooldowns();
    this.scene.characterSwitchManager.saveCurrentCharacterState(this.scene.player);
  }

  /**
   *  현재 캐릭터의 체력/마나 저장
   */
  async saveCurrentResources() {
    const { player } = this.scene;

    if (player && player.saveResources) {
      await player.saveResources();
    }
  }

  async saveCooldowns() {
    const { uiScene, player, selectedCharacter } = this.scene;

    if (uiScene && player) {
      await uiScene.saveCurrentCooldowns(selectedCharacter, player);
    }
  }

  getNextCharacterType(direction) {
    const manager = this.scene.characterSwitchManager;

    return direction === 'next'
      ? manager.switchToNextCharacter()
      : manager.switchToPreviousCharacter();
  }

  async performSwitch(nextType) {
    this.scene.characterSwitchManager.setTransitioning(true);

    const state = this.captureCurrentState();
    this.scene.cameras.main.flash(200, 255, 255, 255);
    this.destroyCurrentPlayer();

    this.scene.time.delayedCall(100, async () => {
      await this.createNewPlayer(nextType, state);
      this.scene.characterSwitchManager.setTransitioning(false);
    });
  }

  captureCurrentState() {
    const { sprite } = this.scene.player;

    return {
      position: { x: sprite.x, y: sprite.y },
      velocity: {
        x: sprite.body.velocity.x,
        y: sprite.body.velocity.y,
      },
      facingRight: !sprite.flipX,
    };
  }

  destroyCurrentPlayer() {
    if (this.scene.playerCollider?.destroy) {
      this.scene.playerCollider.destroy();
      this.scene.playerCollider = null;
    }

    this.scene.player?.destroy();
    this.scene.player = null;
  }

  async createNewPlayer(nextType, state) {
    // 먼저 캐릭터 타입 변경
    this.scene.selectedCharacter = nextType;
    this.scene.characterSwitchManager.setCurrentCharacterType(nextType);

    const { x, y } = state.position;

    //  캐릭터 생성
    this.scene.createPlayer(nextType, x, y, true);

    //  생성 후 체력/마나 복원
    if (this.scene.player && this.scene.player.loadSavedResources) {
      await this.scene.player.loadSavedResources();
    }

    this.restorePlayerState(state);
    this.updateSceneReferences();
    this.emitChangeEvents(nextType);

    // 저장 후 확인
    await this.scene.saveCurrentPosition();
  }

  restorePlayerState(state) {
    const { sprite } = this.scene.player;
    sprite.body.setVelocity(state.velocity.x, state.velocity.y);
    sprite.setFlipX(!state.facingRight);
  }

  updateSceneReferences() {
    this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.1, 0.1);

    if (this.scene.enemyManager) {
      this.scene.enemyManager.player = this.scene.player;
    }
  }

  emitChangeEvents(nextType) {
    this.scene.events.emit('character-changed', {
      characterType: nextType,
      player: this.scene.player,
    });
  }

  /**
   * 특정 캐릭터로 직접 전환 (캐릭터 선택 UI용)
   * @param {string} targetCharacterType - 전환할 캐릭터 타입
   */
  async switchToCharacter(targetCharacterType) {
    const scene = this.scene;

    // 이미 같은 캐릭터면 무시
    if (scene.selectedCharacter === targetCharacterType) {
      return;
    }

    // 트랜지션 체크
    if (this.isTransitioning()) {
      return;
    }

    // 쿨다운 체크
    if (scene.isCharacterSwitchOnCooldown) {
      return;
    }

    // 준비 단계 (현재 캐릭터 상태 저장)
    await this.prepareSwitch();

    // 실제 전환 수행
    await this.performSwitch(targetCharacterType);
  }
}
