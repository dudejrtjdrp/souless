export class SkillHitbox {
  constructor(scene, sprite, name, config, effectManager = null) {
    this.scene = scene;
    this.sprite = sprite;
    this.name = name;
    this.config = config;
    this.effectManager = effectManager;

    this.active = false;
    this.hitEnemies = new Set();
    this.hitboxes = [];
    this.debug = !!config.debug;

    // 실시간 타이머들 (히트스톱 영향 안 받음)
    this.deactivateTimer = null;
    this.sequenceTimers = [];

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
      effectKey: hitboxData.effect, // 이펙트 키 추가
    });

    rect.setVisible(false);
  }

  activate(duration) {
    if (this.hitboxes.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();
    this.updatePosition();

    this.hitboxes.forEach((h) => {
      // 히트박스 표시
      if (this.debug) {
        h.rect.setVisible(true);
        h.rect.setFillStyle(0xff0000, 0.4);
      }
      this.scene.children.bringToTop(h.rect);

      // ✅ impactEffect는 캐릭터 기준 고정 위치에 표시
      if (this.effectManager && this.config.impactEffect) {
        try {
          const flipX = this.sprite.flipX;
          const offsetX = flipX ? -h.offsetX : h.offsetX;
          const effectX = this.sprite.x + offsetX;
          const effectY = this.sprite.y + h.offsetY;

          this.effectManager.playEffect(this.config.impactEffect, effectX, effectY, flipX);

          console.log(`🎆 ImpactEffect at character position:`, {
            effect: this.config.impactEffect,
            x: effectX.toFixed(2),
            y: effectY.toFixed(2),
            charX: this.sprite.x.toFixed(2),
            charY: this.sprite.y.toFixed(2),
          });
        } catch (error) {
          console.warn(`Failed to play impact effect:`, error);
        }
      }
    });

    // 기존 타이머 정리
    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
      this.deactivateTimer = null;
    }

    if (duration) {
      this.deactivateTimer = setTimeout(() => {
        this.deactivate();
      }, duration);
    }
  }

  activateSequence(sequence) {
    if (!sequence || sequence.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();

    this.clearSequenceTimers();

    const activeHitboxes = [];

    sequence.forEach((step) => {
      const delayTimer = setTimeout(() => {
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
        const posX = this.sprite.x + offsetX;
        const posY = this.sprite.y + step.hitbox.offsetY;

        temp.setPosition(posX, posY);

        const tempHitboxData = {
          rect: temp,
          offsetX: step.hitbox.offsetX,
          offsetY: step.hitbox.offsetY,
          damage: step.damage || this.config.damage,
          knockback: step.knockback || this.config.knockback,
          effects: step.effects || this.config.effects,
          effectKey: step.effect || step.hitbox.effect, // 이펙트 키
          isMoving: false,
        };

        // ✅ 시퀀스의 impactEffect는 캐릭터 기준 위치
        if (this.effectManager && this.config.impactEffect) {
          try {
            this.effectManager.playEffect(this.config.impactEffect, posX, posY, flipX);
          } catch (error) {
            console.warn(`Failed to play sequence impact effect:`, error);
          }
        }

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
        const durationTimer = setTimeout(() => {
          const idx = this.hitboxes.indexOf(tempHitboxData);
          if (idx > -1) this.hitboxes.splice(idx, 1);
          const aidx = activeHitboxes.indexOf(tempHitboxData);
          if (aidx > -1) activeHitboxes.splice(aidx, 1);
          temp.destroy();
        }, dur);

        this.sequenceTimers.push(durationTimer);
      }, step.delay || 0);

      this.sequenceTimers.push(delayTimer);
    });

    const totalDuration =
      Math.max(...sequence.map((s) => (s.delay || 0) + (s.duration || 200))) + 100;

    const finalTimer = setTimeout(() => {
      this.deactivate();
    }, totalDuration);

    this.sequenceTimers.push(finalTimer);
  }

  deactivate() {
    this.active = false;
    this.hitEnemies.clear();

    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
      this.deactivateTimer = null;
    }

    this.hitboxes.forEach((h) => {
      if (this.debug && h.rect) {
        h.rect.setFillStyle(0x00ff00, 0.15);
        h.rect.setVisible(false);
      }
    });
  }

  clearSequenceTimers() {
    this.sequenceTimers.forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    this.sequenceTimers = [];
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

        // ✅ hitbox.effect는 적이 맞은 위치 (히트박스 위치)에 표시
        if (this.effectManager && hitbox.effectKey) {
          try {
            // 히트박스의 현재 위치 사용 (적과 교차하는 지점)
            const hitEffectX = hitbox.rect.x;
            const hitEffectY = hitbox.rect.y;

            this.effectManager.playEffect(
              hitbox.effectKey,
              hitEffectX,
              hitEffectY,
              this.sprite.flipX,
            );

            console.log(`⚔️ Hitbox effect at hit position:`, {
              effect: hitbox.effectKey,
              x: hitEffectX.toFixed(2),
              y: hitEffectY.toFixed(2),
              enemyX: targetSprite.x.toFixed(2),
              enemyY: targetSprite.y.toFixed(2),
            });
          } catch (error) {
            console.warn(`Failed to play hitbox effect:`, error);
          }
        }

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
    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
      this.deactivateTimer = null;
    }

    this.clearSequenceTimers();

    this.hitboxes.forEach((hb) => {
      if (hb.rect) hb.rect.destroy();
    });
    this.hitboxes = [];
    this.hitEnemies.clear();
  }
}
