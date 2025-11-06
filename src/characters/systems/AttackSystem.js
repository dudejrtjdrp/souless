// characters/systems/AttackSystem.js
export default class AttackSystem {
  constructor(scene, sprite, hitboxSize, duration, offset) {
    this.scene = scene;
    this.sprite = sprite;
    this.hitboxSize = hitboxSize;
    this.duration = duration;
    this.offset = offset;

    this.active = false;
    this.hitbox = null;
    this.hasHitThisAttack = false; // 이번 공격에서 히트 발생 여부

    this.createHitbox();
  }

  createHitbox() {
    this.hitbox = this.scene.add.rectangle(
      0,
      0,
      this.hitboxSize.width,
      this.hitboxSize.height,
      0xff0000,
      0,
    );

    this.hitbox.setVisible(false);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
  }

  activate() {
    this.active = true;
    this.hasHitThisAttack = false; // 새 공격 시작 - 플래그 초기화
    this.updateHitboxPosition();
    this.hitbox.setVisible(false);
    this.scene.time.delayedCall(this.duration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hitbox.setVisible(false);
    this.hasHitThisAttack = false; // 비활성화 시에도 초기화
  }

  updateHitboxPosition() {
    if (!this.active) return;

    const flipX = this.sprite.flipX;
    const x = this.sprite.x + (flipX ? -this.offset.x : this.offset.x);
    const y = this.sprite.y + this.offset.y;

    this.hitbox.setPosition(x, y);
  }

  checkHit(target) {
    if (!this.active) return false;
    if (!target) return false;

    // 이미 이번 공격에서 누군가를 맞췄으면 더 이상 체크 안함
    if (this.hasHitThisAttack) {
      return false;
    }

    const targetSprite = target.sprite || target;

    if (!targetSprite || typeof targetSprite.getBounds !== 'function') {
      return false;
    }

    this.updateHitboxPosition();

    const bounds1 = this.hitbox.getBounds();
    const bounds2 = targetSprite.getBounds();

    const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);

    if (hit) {
      this.hasHitThisAttack = true; // 플래그 설정 - 더 이상 히트 불가
      return true;
    }

    return false;
  }

  isActive() {
    return this.active;
  }

  destroy() {
    if (this.hitbox) {
      this.hitbox.destroy();
    }
  }

  setDebug(visible) {
    if (this.hitbox) {
      this.hitbox.setAlpha(visible ? 0.3 : 0);
      this.hitbox.setVisible(visible);
    }
  }
}
