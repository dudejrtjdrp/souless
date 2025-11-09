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
    this.prevState = {
      space: false,
      attack: false,
      q: false,
      w: false,
      e: false,
      r: false,
      s: false,
      backQuote: false,
      tab: false,
      l: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };
  }

  getInputState() {
    const { cursors, keys } = this;

    // 현재 키 상태
    const currentSpaceDown = keys.space.isDown || keys.z.isDown;
    const currentAttackDown = keys.a.isDown;
    const currentQ = keys.q.isDown;
    const currentW = keys.w.isDown;
    const currentE = keys.e.isDown;
    const currentR = keys.r.isDown;
    const currentS = keys.s.isDown;
    const currentBackQuote = keys.backQuote.isDown;
    const currentTab = keys.tab.isDown;
    const currentL = keys.l.isDown;
    const currentLeft = keys.left.isDown;
    const currentRight = keys.right.isDown;
    const currentUp = keys.up.isDown;
    const currentDown = keys.down.isDown;

    // 엣지 감지 (down edge: false -> true)
    const isJumpPressed = currentSpaceDown && !this.prevState.space;
    const isAttackPressed = currentAttackDown && !this.prevState.attack;
    const isQPressed = currentQ && !this.prevState.q;
    const isWPressed = currentW && !this.prevState.w;
    const isEPressed = currentE && !this.prevState.e;
    const isRPressed = currentR && !this.prevState.r;
    const isSPressed = currentS && !this.prevState.s;
    const isBackQuotePressed = currentBackQuote && !this.prevState.backQuote;
    const isTabPressed = currentTab && !this.prevState.tab;
    const isLPressed = currentL && !this.prevState.l;
    const isLeftPressed = currentLeft && !this.prevState.left;
    const isRightPressed = currentRight && !this.prevState.right;
    const isUpPressed = currentUp && !this.prevState.up;
    const isDownPressed = currentDown && !this.prevState.down;

    // 이전 상태 갱신
    this.prevState.space = currentSpaceDown;
    this.prevState.attack = currentAttackDown;
    this.prevState.q = currentQ;
    this.prevState.w = currentW;
    this.prevState.e = currentE;
    this.prevState.r = currentR;
    this.prevState.s = currentS;
    this.prevState.backQuote = currentBackQuote;
    this.prevState.tab = currentTab;
    this.prevState.l = currentL;
    this.prevState.left = currentLeft;
    this.prevState.right = currentRight;
    this.prevState.up = currentUp;
    this.prevState.down = currentDown;

    return {
      cursors,
      isMoving: cursors.left.isDown || cursors.right.isDown,
      isRunning: keys.shift.isDown,
      isJumpPressed,
      isAttackPressed,
      isQPressed,
      isWPressed,
      isEPressed,
      isRPressed,
      isSPressed,
      isBackQuotePressed, // ` 키
      isTabPressed, // Tab 키
      isLPressed, // L 키
      isLeftPressed,
      isRightPressed,
      isUpPressed,
      isDownPressed,
      // 키를 계속 누르고 있는지 확인
      isJumpHeld: currentSpaceDown,
      isAttackHeld: currentAttackDown,
      raw: keys, // 필요시 직접 접근
    };
  }

  // 특정 키의 JustDown 확인 (Phaser의 JustDown 대체)
  isKeyJustDown(key) {
    return Phaser.Input.Keyboard.JustDown(key);
  }

  // 입력 핸들러 정리
  destroy() {
    // 키 입력 해제
    Object.values(this.keys).forEach((key) => {
      if (key && key.destroy) {
        key.destroy();
      }
    });

    // 커서 키 해제
    if (this.cursors) {
      Object.values(this.cursors).forEach((key) => {
        if (key && key.destroy) {
          key.destroy();
        }
      });
    }

    this.keys = null;
    this.cursors = null;
    this.scene = null;
  }
}
