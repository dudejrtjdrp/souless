// characters/systems/InputHandler.js
export default class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();

    this.keys = {
      shift: scene.input.keyboard.addKey('SHIFT'),
      space: scene.input.keyboard.addKey('SPACE'),
      z: scene.input.keyboard.addKey('Z'),
      a: scene.input.keyboard.addKey('A'), // 공격 키
    };

    this.prevState = {
      space: false,
      attack: false, // 공격 상태
    };
  }

  getInputState() {
    const cursors = this.cursors;
    const keys = this.keys;

    const currentSpaceDown = keys.space.isDown || keys.z.isDown;
    const currentAttackDown = keys.a.isDown; // X키로 공격

    const isJumpPressed = currentSpaceDown && !this.prevState.space;
    const isAttackPressed = currentAttackDown && !this.prevState.attack;

    this.prevState.space = currentSpaceDown;
    this.prevState.attack = currentAttackDown;

    return {
      cursors: cursors,
      isMoving: cursors.left.isDown || cursors.right.isDown,
      isRunning: keys.shift.isDown,
      isJumpPressed: isJumpPressed,
      isAttackPressed: isAttackPressed,
    };
  }
}
