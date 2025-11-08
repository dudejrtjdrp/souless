export default class AttackSystem {
  constructor(scene, sprite, hitboxSize, duration, offset) {
    this.scene = scene;
    this.sprite = sprite;
    this.hitboxSize = hitboxSize;
    this.duration = duration;
    this.offset = offset;

    this.active = false;
    this.hitbox = null;
    this.hasHitThisAttack = false;

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

    this.hitbox.setVisible(true); // ✅ 디버그용
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
  }

  activate() {
    this.active = true;
    this.hasHitThisAttack = false;
    this.updateHitboxPosition();

    this.scene.time.delayedCall(this.duration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hasHitThisAttack = false;
  }

  updateHitboxPosition() {
    if (!this.active) return;

    const flipX = this.sprite.flipX;
    const x = this.sprite.x + (flipX ? -this.offset.x : this.offset.x);
    const y = this.sprite.y + this.offset.y;

    this.hitbox.setPosition(x, y);
  }

  checkHit(target) {
    if (!this.active || !target || this.hasHitThisAttack) {
      return false;
    }

    const targetSprite = target.sprite || target;

    if (!targetSprite?.getBounds) {
      return false;
    }

    this.updateHitboxPosition();

    const bounds1 = this.hitbox.getBounds();
    const bounds2 = targetSprite.getBounds();

    const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);

    if (hit) {
      this.hasHitThisAttack = true;
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
    if (this.hitbox) {
      this.hitbox.destroy();
    }
  }
}
