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
      backQuote: scene.input.keyboard.addKey('BACKTICK'), // ` 키
      tab: scene.input.keyboard.addKey('TAB'), // Tab 키
      l: scene.input.keyboard.addKey('L'), // L 키
      esc: scene.input.keyboard.addKey('ESC'), // ESC 키
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    };

    // 이전 상태 저장 (엣지 감지용)
    this.prevState = {};

    // 초기화: 모든 키를 false로 시작 (pressed 오작동 방지)
    Object.keys(this.keys).forEach((key) => {
      this.prevState[key] = false;
    });

    // 초기화 완료 플래그
    this.initialized = false;
  }

  getInputState() {
    const { cursors, keys, prevState } = this;

    // 각 키 현재 상태
    const state = {};
    Object.keys(keys).forEach((key) => {
      state[key] = keys[key].isDown;
    });

    // 첫 호출 시 prevState를 현재 상태로 동기화하고 pressed 무시
    if (!this.initialized) {
      Object.keys(keys).forEach((key) => {
        prevState[key] = state[key]; // 현재 눌린 키들을 이전 상태로 설정
      });
      this.initialized = true;

      // 초기화 프레임에서는 모든 pressed를 false로 반환
      return this.getEmptyPressedState(cursors, state);
    }

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

    [
      'q',
      'w',
      'e',
      'r',
      's',
      'b',
      'backQuote',
      'tab',
      'l',
      'esc',
      'left',
      'right',
      'up',
      'down',
    ].forEach((key) => {
      keysPressed[key] = state[key] && !prevState[key];
      keysReleased[key] = !state[key] && prevState[key];
      keysHeld[key] = state[key];
    });

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
      isBPressed: keysPressed.b,
      isBackQuotePressed: keysPressed.backQuote,
      isTabPressed: keysPressed.tab,
      isLPressed: keysPressed.l,
      isEscPressed: keysPressed.esc,
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
      isBackQuoteReleased: keysReleased.backQuote,
      isTabReleased: keysReleased.tab,
      isLReleased: keysReleased.l,
      isEscReleased: keysReleased.esc,
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
      isBackQuoteHeld: keysHeld.backQuote,
      isTabHeld: keysHeld.tab,
      isLHeld: keysHeld.l,
      isEscHeld: keysHeld.esc,
      isLeftHeld: keysHeld.left,
      isRightHeld: keysHeld.right,
      isUpHeld: keysHeld.up,
      isDownHeld: keysHeld.down,

      raw: keys,
    };
  }

  // 초기화 프레임용 빈 pressed 상태 반환
  getEmptyPressedState(cursors, state) {
    return {
      cursors,
      isMoving: cursors.left.isDown || cursors.right.isDown,
      isRunning: state.shift,

      // 모든 Pressed는 false
      isJumpPressed: false,
      isAttackPressed: false,
      isQPressed: false,
      isWPressed: false,
      isEPressed: false,
      isRPressed: false,
      isSPressed: false,
      isBPressed: false,
      isBackQuotePressed: false,
      isTabPressed: false,
      isLPressed: false,
      isEscPressed: false,
      isLeftPressed: false,
      isRightPressed: false,
      isUpPressed: false,
      isDownPressed: false,

      // 모든 Released도 false
      isJumpReleased: false,
      isAttackReleased: false,
      isQReleased: false,
      isWReleased: false,
      isEReleased: false,
      isRReleased: false,
      isSReleased: false,
      isBReleased: false,
      isBackQuoteReleased: false,
      isTabReleased: false,
      isLReleased: false,
      isEscReleased: false,
      isLeftReleased: false,
      isRightReleased: false,
      isUpReleased: false,
      isDownReleased: false,

      // Held는 현재 상태 반영
      isJumpHeld: state.space || state.z,
      isAttackHeld: state.a,
      isQHeld: state.q,
      isWHeld: state.w,
      isEHeld: state.e,
      isRHeld: state.r,
      isSHeld: state.s,
      isBHeld: state.s,
      isBackQuoteHeld: state.backQuote,
      isTabHeld: state.tab,
      isLHeld: state.l,
      isEscHeld: state.esc,
      isLeftHeld: state.left,
      isRightHeld: state.right,
      isUpHeld: state.up,
      isDownHeld: state.down,

      raw: this.keys,
    };
  }

  //  새로 추가: 직접 키 상태 체크하는 헬퍼 메서드들
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

  //  새로 추가: 모든 입력 체크 후 prevState 갱신
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
