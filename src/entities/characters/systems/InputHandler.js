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
      b: scene.input.keyboard.addKey('B'),
      p: scene.input.keyboard.addKey('P'), // 테스트 레벨업
      backQuote: scene.input.keyboard.addKey('BACKTICK'), // ` 키
      tab: scene.input.keyboard.addKey('TAB'), // Tab 키
      l: scene.input.keyboard.addKey('L'), // L 키
      esc: scene.input.keyboard.addKey('ESC'), // ESC 키
      enter: scene.input.keyboard.addKey('ENTER'),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    };

    // 이전 상태 저장 (엣지 감지용)
    this.prevState = {};

    // 초기화: 모든 키를 false로 시작
    Object.keys(this.keys).forEach((key) => {
      this.prevState[key] = false;
    });

    this.initialized = false;
  }

  getInputState() {
    const { cursors, keys, prevState } = this;

    const state = {};
    Object.keys(keys).forEach((key) => {
      state[key] = keys[key].isDown;
    });

    if (!this.initialized) {
      Object.keys(keys).forEach((key) => {
        prevState[key] = state[key];
      });
      this.initialized = true;
      return this.getEmptyPressedState(cursors, state);
    }

    const isJumpHeld = state.space || state.z;
    const isJumpPressed = (state.space && !prevState.space) || (state.z && !prevState.z);
    const isJumpReleased = !state.space && prevState.space && !state.z && prevState.z;

    const isAttackHeld = state.a;
    const isAttackPressed = state.a && !prevState.a;
    const isAttackReleased = !state.a && prevState.a;

    const keysPressed = {};
    const keysReleased = {};
    const keysHeld = {};

    [
      'q',
      'w',
      'e',
      'r',
      's',
      'b',
      'p', // p 추가
      'backQuote',
      'tab',
      'l',
      'esc',
      'enter',
      'left',
      'right',
      'up',
      'down',
    ].forEach((key) => {
      keysPressed[key] = state[key] && !prevState[key];
      keysReleased[key] = !state[key] && prevState[key];
      keysHeld[key] = state[key];
    });

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
      isBPressed: keysPressed.b,
      isPPressed: keysPressed.p, // P키 Pressed
      isBackQuotePressed: keysPressed.backQuote,
      isTabPressed: keysPressed.tab,
      isLPressed: keysPressed.l,
      isEscPressed: keysPressed.esc,
      isEnterPressed: keysPressed.enter,
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
      isBReleased: keysReleased.b,
      isPReleased: keysReleased.p, // P키 Released
      isBackQuoteReleased: keysReleased.backQuote,
      isTabReleased: keysReleased.tab,
      isLReleased: keysReleased.l,
      isEscReleased: keysReleased.esc,
      isEnterReleased: keysReleased.enter,
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
      isBHeld: keysHeld.b,
      isPHeld: keysHeld.p, // P키 Held
      isBackQuoteHeld: keysHeld.backQuote,
      isTabHeld: keysHeld.tab,
      isLHeld: keysHeld.l,
      isEscHeld: keysHeld.esc,
      isEnterHeld: keysHeld.enter,
      isLeftHeld: keysHeld.left,
      isRightHeld: keysHeld.right,
      isUpHeld: keysHeld.up,
      isDownHeld: keysHeld.down,

      raw: keys,
    };
  }

  getEmptyPressedState(cursors, state) {
    return {
      cursors,
      isMoving: cursors.left.isDown || cursors.right.isDown,
      isRunning: state.shift,

      isJumpPressed: false,
      isAttackPressed: false,
      isQPressed: false,
      isWPressed: false,
      isEPressed: false,
      isRPressed: false,
      isSPressed: false,
      isBPressed: false,
      isPPressed: false, // ✅
      isBackQuotePressed: false,
      isTabPressed: false,
      isLPressed: false,
      isEscPressed: false,
      isEnterPressed: false,
      isLeftPressed: false,
      isRightPressed: false,
      isUpPressed: false,
      isDownPressed: false,

      isJumpReleased: false,
      isAttackReleased: false,
      isQReleased: false,
      isWReleased: false,
      isEReleased: false,
      isRReleased: false,
      isSReleased: false,
      isBReleased: false,
      isPReleased: false, // ✅
      isBackQuoteReleased: false,
      isTabReleased: false,
      isLReleased: false,
      isEscReleased: false,
      isEnterReleased: false,
      isLeftReleased: false,
      isRightReleased: false,
      isUpReleased: false,
      isDownReleased: false,

      isJumpHeld: state.space || state.z,
      isAttackHeld: state.a,
      isQHeld: state.q,
      isWHeld: state.w,
      isEHeld: state.e,
      isRHeld: state.r,
      isSHeld: state.s,
      isBHeld: state.s,
      isPHeld: state.p, // ✅
      isBackQuoteHeld: state.backQuote,
      isTabHeld: state.tab,
      isLHeld: state.l,
      isEscHeld: state.esc,
      isEnterHeld: state.enter,
      isLeftHeld: state.left,
      isRightHeld: state.right,
      isUpHeld: state.up,
      isDownHeld: state.down,

      raw: this.keys,
    };
  }

  isPressed(keyName) {
    if (!this.initialized) return false;
    const currentState = this.keys[keyName]?.isDown || false;
    const prevState = this.prevState[keyName] || false;
    return currentState && !prevState;
  }

  isReleased(keyName) {
    if (!this.initialized) return false;
    const currentState = this.keys[keyName]?.isDown || false;
    const prevState = this.prevState[keyName] || false;
    return !currentState && prevState;
  }

  isHeld(keyName) {
    return this.keys[keyName]?.isDown || false;
  }

  updatePrevState() {
    Object.keys(this.keys).forEach((key) => {
      this.prevState[key] = this.keys[key]?.isDown || false;
    });
  }

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
