import Phaser from 'phaser';

export class SkillHitbox {
  constructor(scene, sprite, name, config) {
    this.scene = scene;
    this.sprite = sprite;
    this.name = name;
    this.config = config;

    this.active = false;
    this.hitEnemies = new Set();
    this.hitboxes = []; // { rect, offsetX, offsetY, isMoving, damage, knockback, effects }

    // 디버그 표시 기본: config.debug true/false
    this.debug = !!config.debug;

    if (config.hitbox) {
      const hitboxArray = Array.isArray(config.hitbox) ? config.hitbox : [config.hitbox];
      hitboxArray.forEach((hb) => this.createHitbox(hb));
    }
  }

  createHitbox(hitboxData) {
    const rect = this.scene.add.rectangle(
      0,
      0,
      hitboxData.width,
      hitboxData.height,
      0x00ff00,
      this.debug ? 0.15 : 0,
    );
    this.scene.physics.add.existing(rect);
    rect.body.setAllowGravity(false);

    this.hitboxes.push({
      rect,
      offsetX: hitboxData.offsetX || 0,
      offsetY: hitboxData.offsetY || 0,
      isMoving: false,
      damage: hitboxData.damage,
      knockback: hitboxData.knockback,
      effects: hitboxData.effects,
    });

    // 처음엔 보이지 않게
    rect.setVisible(false);
  }

  // 일반 단일 히트박스 활성화 (원본 activate)
  activate() {
    if (this.hitboxes.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();
    this.updatePosition();

    this.hitboxes.forEach((h) => {
      if (this.debug) {
        h.rect.setVisible(true);
        h.rect.setFillStyle(0xff0000, 0.4);
      }
      this.scene.children.bringToTop(h.rect);
    });

    // duration 후 deactivate
    const duration = this.config.duration || 200;
    this.scene.time.delayedCall(duration, () => this.deactivate());
  }

  // 시퀀스 활성화 (원본 activateSequence)
  activateSequence(sequence) {
    if (!sequence || sequence.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();

    const activeHitboxes = [];

    sequence.forEach((step) => {
      this.scene.time.delayedCall(step.delay || 0, () => {
        const temp = this.scene.add.rectangle(
          0,
          0,
          step.hitbox.width,
          step.hitbox.height,
          this.debug ? 0xff0000 : 0x000000,
          this.debug ? 0.4 : 0,
        );
        this.scene.physics.add.existing(temp);
        temp.body.setAllowGravity(false);

        const flipX = this.sprite.flipX;
        const offsetX = flipX ? -step.hitbox.offsetX : step.hitbox.offsetX;
        temp.setPosition(this.sprite.x + offsetX, this.sprite.y + step.hitbox.offsetY);

        const tempHitboxData = {
          rect: temp,
          offsetX: step.hitbox.offsetX,
          offsetY: step.hitbox.offsetY,
          damage: step.damage || this.config.damage,
          knockback: step.knockback || this.config.knockback,
          effects: step.effects || this.config.effects,
          isMoving: false,
        };

        if (step.movement) {
          tempHitboxData.isMoving = true;
          const dir = flipX ? -1 : 1;
          const vx = (step.movement.velocityX || 0) * dir;
          const vy = step.movement.velocityY || 0;
          temp.body.setVelocity(vx, vy);
        }

        this.hitboxes.push(tempHitboxData);
        activeHitboxes.push(tempHitboxData);

        const dur = step.duration || 200;
        this.scene.time.delayedCall(dur, () => {
          const idx = this.hitboxes.indexOf(tempHitboxData);
          if (idx > -1) this.hitboxes.splice(idx, 1);
          const aidx = activeHitboxes.indexOf(tempHitboxData);
          if (aidx > -1) activeHitboxes.splice(aidx, 1);
          temp.destroy();
        });
      });
    });

    // 전체가 끝나면 deactivate
    const totalDuration =
      Math.max(...sequence.map((s) => (s.delay || 0) + (s.duration || 200))) + 100;
    this.scene.time.delayedCall(totalDuration, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.active = false;
    this.hitEnemies.clear();
    this.hitboxes.forEach((h) => {
      if (this.debug && h.rect) {
        h.rect.setFillStyle(0x00ff00, 0.15);
        h.rect.setVisible(false);
      }
    });
  }

  updatePosition() {
    if (!this.active) return;
    const flipX = this.sprite.flipX;

    this.hitboxes.forEach((hitbox) => {
      if (hitbox.isMoving) return;
      const offsetX = flipX ? -hitbox.offsetX : hitbox.offsetX;
      const x = this.sprite.x + offsetX;
      const y = this.sprite.y + hitbox.offsetY;
      hitbox.rect.setPosition(x, y);
    });
  }

  checkHit(target) {
    if (!this.active || this.hitboxes.length === 0 || !target) return false;
    const targetSprite = target.sprite || target;
    if (!targetSprite?.getBounds) return false;

    const enemyId = targetSprite.name || targetSprite;

    if (this.config.targetType === 'single' && this.hitEnemies.size > 0) {
      return false;
    }
    if (this.config.targetType === 'single' && this.hitEnemies.has(enemyId)) {
      return false;
    }

    this.updatePosition();
    const targetBounds = targetSprite.getBounds();

    for (const hitbox of this.hitboxes) {
      const bounds = hitbox.rect.getBounds();
      const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);
      if (hit) {
        this.hitEnemies.add(enemyId);
        return {
          hit: true,
          damage: hitbox.damage || this.config.damage || 0,
          knockback: hitbox.knockback || this.config.knockback || { x: 0, y: 0 },
          effects: hitbox.effects || this.config.effects || [],
          targetType: this.config.targetType,
        };
      }
    }

    return false;
  }

  isActive() {
    return this.active;
  }

  getHitboxBounds() {
    if (!this.active || this.hitboxes.length === 0) return null;
    return this.hitboxes.map((h) => h.rect.getBounds());
  }

  destroy() {
    this.hitboxes.forEach((hb) => {
      if (hb.rect) hb.rect.destroy();
    });
    this.hitboxes = [];
    this.hitEnemies.clear();
  }
}
