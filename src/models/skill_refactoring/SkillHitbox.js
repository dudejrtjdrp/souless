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

    // 기본 히트박스 지속 시간 (config에서 설정 가능)
    this.defaultHitboxDuration = config.hitboxDuration || 200;

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
      isFixed: false, // 위치가 고정되었는지 여부
      damage: hitboxData.damage,
      knockback: hitboxData.knockback,
      effects: hitboxData.effects,
      effectKey: hitboxData.effect, // 이펙트 키 추가
      duration: hitboxData.duration || this.defaultHitboxDuration, // 개별 duration 또는 기본값
    });

    rect.setVisible(false);
  }

  activate(duration) {
    if (this.hitboxes.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();

    // 히트박스 위치를 activate 시점에 한 번만 설정하고 고정
    const flipX = this.sprite.flipX;
    this.hitboxes.forEach((hitbox) => {
      const offsetX = flipX ? -hitbox.offsetX : hitbox.offsetX;
      const x = this.sprite.x + offsetX;
      const y = this.sprite.y + hitbox.offsetY;
      hitbox.rect.setPosition(x, y);
      hitbox.isFixed = true; // 위치 고정
    });

    // impactEffect는 스킬 활성화 시 캐릭터 위치를 기준으로 한 번만 재생
    if (this.effectManager && this.config.impactEffect) {
      try {
        const effectX = this.sprite.x;
        const effectY = this.sprite.y;

        this.effectManager.playEffect(this.config.impactEffect, effectX, effectY, flipX);
      } catch (error) {
        console.warn(`Failed to play impact effect:`, error);
      }
    }

    this.hitboxes.forEach((h) => {
      // 히트박스 표시
      if (this.debug) {
        h.rect.setVisible(true);
        h.rect.setFillStyle(0xff0000, 0.4);
      }
      this.scene.children.bringToTop(h.rect);
    });

    // 기존 타이머 정리
    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
      this.deactivateTimer = null;
    }

    // duration이 명시되면 그것을 사용, 아니면 개별 히트박스 duration 중 최대값 사용
    const finalDuration = duration || Math.max(...this.hitboxes.map((h) => h.duration));

    if (finalDuration) {
      this.deactivateTimer = setTimeout(() => {
        this.deactivate();
      }, finalDuration);
    }
  }

  activateSequence(sequence) {
    if (!sequence || sequence.length === 0) return;

    this.active = true;
    this.hitEnemies.clear();

    this.clearSequenceTimers();

    const activeHitboxes = [];

    // impactEffect는 시퀀스 시작 시 캐릭터 위치를 기준으로 한 번만 재생
    if (this.effectManager && this.config.impactEffect) {
      try {
        const flipX = this.sprite.flipX;
        const effectX = this.sprite.x;
        const effectY = this.sprite.y;

        this.effectManager.playEffect(this.config.impactEffect, effectX, effectY, flipX);
      } catch (error) {
        console.warn(`Failed to play sequence impact effect:`, error);
      }
    }

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
          effectKey: step.effect || step.hitbox.effect,
          isMoving: false,
          isSequence: true, // 시퀀스 히트박스 표시
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

        // ⭐ duration 우선순위 수정
        // 시퀀스에서는 명시적으로 지정된 duration만 사용 (defaultHitboxDuration 무시)
        const dur = step.duration || step.hitbox.duration || 200;
        console.log(`[SkillHitbox] Hitbox duration: ${dur}ms for step:`, step);

        // ⭐ 히트박스 제거 타이머
        const durationTimer = setTimeout(() => {
          // this.hitboxes 배열에서 제거
          const idx = this.hitboxes.indexOf(tempHitboxData);
          if (idx > -1) {
            this.hitboxes.splice(idx, 1);
          }

          // activeHitboxes 배열에서 제거
          const aidx = activeHitboxes.indexOf(tempHitboxData);
          if (aidx > -1) {
            activeHitboxes.splice(aidx, 1);
          }

          // 디버그 표시 숨김
          if (this.debug && temp) {
            temp.setVisible(false);
          }

          // 실제 오브젝트 파괴
          if (temp) {
            temp.destroy();
          }

          console.log(`[SkillHitbox] Hitbox destroyed after ${dur}ms`);
        }, dur);

        this.sequenceTimers.push(durationTimer);
      }, step.delay || 0);

      this.sequenceTimers.push(delayTimer);
    });

    // ⭐ 전체 시퀀스 종료 시간 계산 수정
    // 각 step의 실제 duration만 사용 (defaultHitboxDuration 무시)
    const totalDuration =
      Math.max(
        ...sequence.map((s) => {
          const delay = s.delay || 0;
          const dur = s.duration || s.hitbox.duration || 200; // 기본값 200ms만 사용
          return delay + dur;
        }),
      ) + 100;

    console.log(`[SkillHitbox] Total sequence duration: ${totalDuration}ms`);

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

    // ⭐ 모든 히트박스 정리 (시퀀스 히트박스 포함)
    this.hitboxes.forEach((h) => {
      if (this.debug && h.rect) {
        h.rect.setFillStyle(0x00ff00, 0.15);
        h.rect.setVisible(false);
      }
      h.isFixed = false;

      // ⭐ 시퀀스 히트박스는 파괴
      if (h.isSequence && h.rect && h.rect.scene) {
        h.rect.destroy();
      }
    });

    // ⭐ 시퀀스 히트박스 배열에서 제거
    this.hitboxes = this.hitboxes.filter((h) => !h.isSequence);
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
      // isMoving이거나 이미 고정된 히트박스는 위치 업데이트 하지 않음
      if (hitbox.isMoving || hitbox.isFixed) return;

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

    const targetBounds = targetSprite.getBounds();

    for (const hitbox of this.hitboxes) {
      // ⭐ 히트박스가 유효한지 확인
      if (!hitbox.rect || !hitbox.rect.scene) {
        continue; // 이미 파괴된 히트박스는 스킵
      }

      const bounds = hitbox.rect.getBounds();
      const hit = Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);

      if (hit) {
        this.hitEnemies.add(enemyId);

        // hitbox.effect는 적이 맞은 위치에 표시
        if (this.effectManager && hitbox.effectKey) {
          try {
            const hitEffectX = hitbox.rect.x;
            const hitEffectY = hitbox.rect.y;

            this.effectManager.playEffect(
              hitbox.effectKey,
              hitEffectX,
              hitEffectY,
              this.sprite.flipX,
            );
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
