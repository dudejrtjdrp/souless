export default class AttackSystem {
  constructor(
    scene,
    sprite,
    hitboxSize,
    duration = 200, // 기본값 추가
    offset = { x: 0, y: 0 }, // 기본값 추가
    targetType = 'single',
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.hitboxSize = hitboxSize;
    this.duration = duration;
    this.offset = offset;
    this.targetType = targetType;

    this.active = false;
    this.hitbox = null;
    this.hasHitThisAttack = false;
    this.hitEnemies = new Set();
    this.deactivateTimer = null; // 타이머 참조 저장

    this.createHitbox();
  }

  createHitbox() {
    this.hitbox = this.scene.add.rectangle(
      0,
      0,
      this.hitboxSize.width,
      this.hitboxSize.height,
      0xff0000,
      0.3,
    );

    this.hitbox.setVisible(false); // 기본적으로 숨김
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
  }

  activate(customDuration) {
    this.active = true;
    this.hasHitThisAttack = false;
    this.hitEnemies.clear();
    this.updateHitboxPosition();
    this.hitbox.setVisible(true); // 활성화 시 표시

    // 기존 타이머 정리
    if (this.deactivateTimer) {
      this.deactivateTimer.remove();
      this.deactivateTimer = null;
    }

    // customDuration이 제공되면 그것을 사용, 아니면 기본 duration 사용
    const finalDuration = customDuration !== undefined ? customDuration : this.duration;

    this.deactivateTimer = this.scene.time.delayedCall(finalDuration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hasHitThisAttack = false;
    this.hitEnemies.clear();
    this.hitbox.setVisible(false); // 비활성화 시 숨김

    if (this.deactivateTimer) {
      this.deactivateTimer.remove();
      this.deactivateTimer = null;
    }
  }

  updateHitboxPosition() {
    if (!this.active) return;

    const flipX = this.sprite.flipX;
    const x = this.sprite.x + (flipX ? -this.offset.x : this.offset.x);
    const y = this.sprite.y + this.offset.y;

    this.hitbox.setPosition(x, y);
  }

  checkHit(target) {
    if (!this.active || !target) {
      return false;
    }

    if (this.targetType === 'single' && this.hasHitThisAttack) {
      return false;
    }

    const targetSprite = target.sprite || target;

    if (!targetSprite) {
      return false;
    }

    this.updateHitboxPosition();

    const attackBounds = this.hitbox.getBounds();

    let targetRect;

    if (targetSprite.body) {
      targetRect = new Phaser.Geom.Rectangle(
        targetSprite.body.x,
        targetSprite.body.y,
        targetSprite.body.width,
        targetSprite.body.height,
      );
    } else {
      targetRect = targetSprite.getBounds();
    }

    const hit = Phaser.Geom.Intersects.RectangleToRectangle(attackBounds, targetRect);

    if (hit) {
      if (this.targetType === 'single') {
        this.hasHitThisAttack = true;
      }

      const enemyId = targetSprite.name || targetSprite;
      this.hitEnemies.add(enemyId);

      return true;
    }

    return false;
  }

  isActive() {
    return this.active;
  }

  getHitboxBounds() {
    if (!this.active) return null;
    return this.hitbox.getBounds();
  }

  destroy() {
    if (this.deactivateTimer) {
      this.deactivateTimer.remove();
      this.deactivateTimer = null;
    }

    if (this.hitbox) {
      this.hitbox.destroy();
    }
  }
}
