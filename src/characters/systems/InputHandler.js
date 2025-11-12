export default class InputHandler {
  constructor(scene) {
    this.scene = scene;

    this.cursors = scene.input.keyboard.createCursorKeys();

    // 공용 키 정의
    this.keys = {
      shift: scene.input.keyboard.addKey('SHIFT'),
      space: scene.input.keyboard.addKey('SPACE'),
      z: scene.input.keyboard.addKey('Z'),
      a: scene.input.keyboard.addKey('A'), // 근접 공격
      q: scene.input.keyboard.addKey('Q'),
      w: scene.input.keyboard.addKey('W'),
      e: scene.input.keyboard.addKey('E'), // 명상
      r: scene.input.keyboard.addKey('R'), // 특수
      s: scene.input.keyboard.addKey('S'), // 보조
      backQuote: scene.input.keyboard.addKey('BACKTICK'), // ` 키
      tab: scene.input.keyboard.addKey('TAB'), // Tab 키
      l: scene.input.keyboard.addKey('L'), // L 키
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    };

    // 이전 상태 저장 (엣지 감지용)
    this.prevState = {};
    Object.keys(this.keys).forEach((key) => {
      this.prevState[key] = false;
    });
  }

  getInputState() {
    const { cursors, keys, prevState } = this;

    // 각 키 현재 상태
    const state = {};
    Object.keys(keys).forEach((key) => {
      state[key] = keys[key].isDown;
    });

    // Jump 키 합성 (space + z)
    const isJumpHeld = state.space || state.z;
    const isJumpPressed = (state.space && !prevState.space) || (state.z && !prevState.z);
    const isJumpReleased = !state.space && prevState.space && !state.z && prevState.z;

    // Attack 키
    const isAttackHeld = state.a;
    const isAttackPressed = state.a && !prevState.a;
    const isAttackReleased = !state.a && prevState.a;

    // 나머지 키 처리
    const keysPressed = {};
    const keysReleased = {};
    const keysHeld = {};

    ['q', 'w', 'e', 'r', 's', 'backQuote', 'tab', 'l', 'left', 'right', 'up', 'down'].forEach(
      (key) => {
        keysPressed[key] = state[key] && !prevState[key];
        keysReleased[key] = !state[key] && prevState[key];
        keysHeld[key] = state[key];
      },
    );

    // 이전 상태 갱신
    Object.keys(keys).forEach((key) => {
      prevState[key] = state[key];
    });

    return {
      cursors,
      isMoving: cursors.left.isDown || cursors.right.isDown,
      isRunning: state.shift,

      // Pressed
      isJumpPressed,
      isAttackPressed,
      isQPressed: keysPressed.q,
      isWPressed: keysPressed.w,
      isEPressed: keysPressed.e,
      isRPressed: keysPressed.r,
      isSPressed: keysPressed.s,
      isBackQuotePressed: keysPressed.backQuote,
      isTabPressed: keysPressed.tab,
      isLPressed: keysPressed.l,
      isLeftPressed: keysPressed.left,
      isRightPressed: keysPressed.right,
      isUpPressed: keysPressed.up,
      isDownPressed: keysPressed.down,

      // Released
      isJumpReleased,
      isAttackReleased,
      isQReleased: keysReleased.q,
      isWReleased: keysReleased.w,
      isEReleased: keysReleased.e,
      isRReleased: keysReleased.r,
      isSReleased: keysReleased.s,
      isBackQuoteReleased: keysReleased.backQuote,
      isTabReleased: keysReleased.tab,
      isLReleased: keysReleased.l,
      isLeftReleased: keysReleased.left,
      isRightReleased: keysReleased.right,
      isUpReleased: keysReleased.up,
      isDownReleased: keysReleased.down,

      // Held
      isJumpHeld,
      isAttackHeld,
      isQHeld: keysHeld.q,
      isWHeld: keysHeld.w,
      isEHeld: keysHeld.e,
      isRHeld: keysHeld.r,
      isSHeld: keysHeld.s,
      isBackQuoteHeld: keysHeld.backQuote,
      isTabHeld: keysHeld.tab,
      isLHeld: keysHeld.l,
      isLeftHeld: keysHeld.left,
      isRightHeld: keysHeld.right,
      isUpHeld: keysHeld.up,
      isDownHeld: keysHeld.down,

      raw: keys,
    };
  }

  // ✅ 새로 추가: 직접 키 상태 체크하는 헬퍼 메서드들
  isPressed(keyName) {
    const currentState = this.keys[keyName]?.isDown || false;
    const prevState = this.prevState[keyName] || false;
    console.log(currentState, prevState);
    return currentState && !prevState;
  }

  isReleased(keyName) {
    const currentState = this.keys[keyName]?.isDown || false;
    const prevState = this.prevState[keyName] || false;
    return !currentState && prevState;
  }

  isHeld(keyName) {
    return this.keys[keyName]?.isDown || false;
  }

  // ✅ 새로 추가: 모든 입력 체크 후 prevState 갱신
  updatePrevState() {
    Object.keys(this.keys).forEach((key) => {
      this.prevState[key] = this.keys[key]?.isDown || false;
    });
  }

  // 기존 메서드들 (하위 호환성 유지)
  isDown(keyName) {
    const state = this.getInputState();
    return state[`is${keyName}Held`] || false;
  }

  isUp(keyName) {
    const state = this.getInputState();
    return state[`is${keyName}Released`] || false;
  }

  destroy() {
    Object.values(this.keys).forEach((key) => {
      if (key && key.destroy) key.destroy();
    });
    if (this.cursors) {
      Object.values(this.cursors).forEach((key) => {
        if (key && key.destroy) key.destroy();
      });
    }
    this.keys = null;
    this.cursors = null;
    this.scene = null;
  }
}
