import { EffectData } from '../../config/effectData';

export class EffectManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = new Map(); // 활성화된 이펙트들
    this.effectPool = new Map(); // 이펙트 풀링
    this.loadedEffects = new Set(); // 로드된 이펙트 추적
    this.debug = false; // 디버그 모드
  }

  /**
   * 플레이스홀더 텍스처 생성 (실제 이펙트가 없을 때 사용)
   */
  createPlaceholderTexture(key) {
    if (this.scene.textures.exists(key)) return;

    const data = EffectData[key];
    if (!data) return;

    // 캔버스로 간단한 플레이스홀더 이펙트 생성
    const width = data.frameWidth || 64;
    const height = data.frameHeight || 64;
    const frameCount = data.frames.end - data.frames.start + 1;

    const canvas = document.createElement('canvas');
    canvas.width = width * frameCount;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 각 프레임 그리기
    for (let i = 0; i < frameCount; i++) {
      const x = i * width;
      const alpha = 1 - (i / frameCount) * 0.5; // 점점 투명해지는 효과

      ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x + width / 2, height / 2, width / 3, 0, Math.PI * 2);
      ctx.fill();

      // 텍스트 표시
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(key, x + width / 2, height / 2);
    }

    // Phaser 텍스처로 추가
    this.scene.textures.addCanvas(key, canvas);
  }

  /**
   * 이펙트 스프라이트시트 로드
   * @param {string} key - 이펙트 키
   */
  preloadEffect(key) {
    const data = EffectData[key];
    if (!data) {
      return;
    }

    if (this.loadedEffects.has(key)) {
      return; // 이미 로드됨
    }

    // Phaser의 load.spritesheet으로 로드 시도
    this.scene.load.spritesheet(key, data.url, {
      frameWidth: data.frameWidth,
      frameHeight: data.frameHeight,
    });

    // 로드 실패 시 플레이스홀더 생성
    this.scene.load.once('loaderror', (file) => {
      if (file.key === key && this.usePlaceholder) {
        this.createPlaceholderTexture(key);
      }
    });

    this.loadedEffects.add(key);
  }

  /**
   * 이펙트 애니메이션 생성
   * @param {string} key - 이펙트 키
   */
  createEffectAnimation(key) {
    const data = EffectData[key];
    if (!data) return;

    // 이미 애니메이션이 생성되어 있으면 스킵
    if (this.scene.anims.exists(key)) {
      return;
    }

    // 텍스처가 제대로 로드되었는지 확인
    if (!this.scene.textures.exists(key)) {
      return;
    }

    try {
      this.scene.anims.create({
        key: key,
        frames: this.scene.anims.generateFrameNumbers(key, {
          start: data.frames.start,
          end: data.frames.end,
        }),
        frameRate: data.frameRate,
        repeat: data.repeat,
      });
    } catch (error) {
      console.error(`Failed to create animation for ${key}:`, error);
    }
  }

  /**
   * 이펙트가 재생 가능한 상태인지 확인
   * @param {string} key - 이펙트 키
   * @returns {boolean}
   */
  isEffectReady(key) {
    return (
      this.scene.textures.exists(key) &&
      this.scene.anims.exists(key) &&
      EffectData[key] !== undefined
    );
  }

  /**
   * 이펙트 재생 (단일 또는 배열)
   * @param {string|string[]} key - 이펙트 키 또는 키 배열
   * @param {number} x - X 위치
   * @param {number} y - Y 위치
   * @param {boolean} flipX - X축 반전 여부 (캐릭터 방향)
   * @param {Object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Sprite[]|null}
   */
  playEffect(key, x, y, flipX = false, options = {}) {
    // 배열인 경우 각각 재생
    if (Array.isArray(key)) {
      const effects = [];
      for (const effectKey of key) {
        const effect = this.playSingleEffect(effectKey, x, y, flipX, options);
        if (effect) {
          effects.push(effect);
        }
      }
      return effects.length > 0 ? effects : null;
    }

    // 단일 이펙트
    return this.playSingleEffect(key, x, y, flipX, options);
  }

  /**
   * 단일 이펙트 재생 (내부 메서드)
   * @param {string} key - 이펙트 키
   * @param {number} x - X 위치
   * @param {number} y - Y 위치
   * @param {boolean} flipX - X축 반전 여부
   * @param {Object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Sprite|null}
   */
  playSingleEffect(key, x, y, flipX = false, options = {}) {
    const data = EffectData[key];
    if (!data) {
      console.warn(`Effect data not found for key: ${key}`);
      return null;
    }

    // 텍스처 확인 (이미 preload에서 로드됨)
    if (!this.scene.textures.exists(key)) {
      console.error(`❌ Effect texture not found: ${key} - Did you call initializeEffects()?`);
      return null;
    }

    // 애니메이션 확인 (이미 create에서 생성됨)
    if (!this.scene.anims.exists(key)) {
      console.error(`❌ Effect animation not found: ${key} - Did you call initializeEffects()?`);
      // 비상용으로 생성 시도
      this.createEffectAnimation(key);
      if (!this.scene.anims.exists(key)) {
        return null;
      }
    }

    let effect = this.getFromPool(key);

    if (!effect) {
      try {
        effect = this.scene.add.sprite(0, 0, key);

        // Verify the sprite has animation component
        if (!effect.anims) {
          console.error(`Sprite for effect ${key} has no animation component`);
          effect.destroy();
          return null;
        }
      } catch (error) {
        console.error(`Failed to create sprite for effect: ${key}`, error);
        return null;
      }

      effect.on('animationcomplete', () => {
        if (data.repeat === 0) {
          this.returnToPool(key, effect);
        }
      });
    }

    // XOR 로직: baseFlip과 flipX 중 하나만 true일 때 반전
    const baseFlip = data.flipX === true;
    const shouldFlip = baseFlip !== flipX;

    // 캐릭터 방향에 따른 오프셋 계산
    const offset = data.offset || { x: 0, y: 0 };

    // ignoreOffset 옵션이 true면 offset 무시
    let finalX, finalY;
    if (options.ignoreOffset) {
      finalX = x;
      finalY = y;
    } else {
      finalX = flipX ? x - offset.x : x + offset.x;
      finalY = y + offset.y;
    }

    effect.setPosition(finalX, finalY);
    effect.setVisible(true);
    effect.setActive(true);

    const scale = options.scale !== undefined ? options.scale : data.scale || 1.0;
    effect.setScale(scale);

    effect.setFlipX(shouldFlip);

    // 회전/각도 처리
    let finalAngle = 0;

    if (options.rotation !== undefined) {
      const rotation = flipX ? -options.rotation : options.rotation;
      effect.setRotation(rotation);
      finalAngle = (rotation * 180) / Math.PI;
    } else {
      const angle = options.angle !== undefined ? options.angle : data.angle || 0;
      const appliedAngle = flipX ? -angle : angle;
      effect.setAngle(appliedAngle);
      finalAngle = appliedAngle;
    }

    effect.setAlpha(data.alpha !== undefined ? data.alpha : 1.0);
    effect.setDepth(options.depth || 100);

    // 색상 적용 (color 또는 tint)
    if (data.color !== undefined) {
      // color는 hex string 또는 number로 받음
      const tintColor =
        typeof data.color === 'string' ? parseInt(data.color.replace('#', ''), 16) : data.color;
      effect.setTint(tintColor);
    } else if (options.color !== undefined) {
      // options로도 색상 전달 가능
      const tintColor =
        typeof options.color === 'string'
          ? parseInt(options.color.replace('#', ''), 16)
          : options.color;
      effect.setTint(tintColor);
    } else {
      // 색상이 없으면 tint 제거
      effect.clearTint();
    }

    // Verify animation component exists before trying to play
    if (!effect.anims) {
      console.error(`Effect sprite has no animation component: ${key}`);
      effect.destroy();
      return null;
    }

    try {
      effect.anims.stop();
      effect.anims.play(key, true);
    } catch (error) {
      console.error(`Failed to play animation for effect: ${key}`, error);
      effect.destroy();
      return null;
    }

    const effectId = `${key}_${Date.now()}_${Math.random()}`;
    this.activeEffects.set(effectId, {
      sprite: effect,
      key: key,
      startTime: this.scene.time.now,
      flipX: shouldFlip,
    });

    return effect;
  }

  /**
   * 히트박스에 이펙트 재생 (단일 또는 배열)
   * @param {string|string[]} key - 이펙트 키 또는 키 배열
   * @param {Object} hitbox - 히트박스 객체
   * @param {boolean} flipX - X축 반전 여부
   * @param {Object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Sprite[]|null}
   */
  playEffectOnHitbox(key, hitbox, flipX = false, options = {}) {
    if (!hitbox) {
      console.warn('Hitbox is null or undefined');
      return null;
    }

    // 히트박스의 월드 좌표 가져오기
    const worldX = hitbox.x;
    const worldY = hitbox.y;

    return this.playEffect(key, worldX, worldY, flipX, options);
  }

  /**
   * 특정 대상에 이펙트 부착 (따라다니는 이펙트, 단일 또는 배열)
   * @param {string|string[]} key - 이펙트 키 또는 키 배열
   * @param {Phaser.GameObjects.Sprite} target - 대상 스프라이트
   * @param {boolean} flipX - X축 반전 여부
   * @param {number} duration - 지속 시간 (ms), undefined면 수동으로 제거해야 함
   * @param {Object} options - 추가 옵션 (angle, rotation 등)
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Sprite[]|null}
   */
  attachEffect(key, target, flipX = false, duration = undefined, options = {}) {
    // 배열인 경우 각각 부착
    if (Array.isArray(key)) {
      const effects = [];
      for (const effectKey of key) {
        const effect = this.attachSingleEffect(effectKey, target, flipX, duration, options);
        if (effect) {
          effects.push(effect);
        }
      }
      return effects.length > 0 ? effects : null;
    }

    // 단일 이펙트
    return this.attachSingleEffect(key, target, flipX, duration, options);
  }

  /**
   * 단일 이펙트 부착 (내부 메서드)
   * @param {string} key - 이펙트 키
   * @param {Phaser.GameObjects.Sprite} target - 대상 스프라이트
   * @param {boolean} flipX - X축 반전 여부
   * @param {number} duration - 지속 시간 (ms)
   * @param {Object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Sprite|null}
   */
  attachSingleEffect(key, target, flipX = false, duration = undefined, options = {}) {
    const data = EffectData[key];
    if (!data || !target) {
      console.warn(`Cannot attach effect: ${key}`);
      return null;
    }

    const effect = this.playSingleEffect(key, target.x, target.y, flipX, options);
    if (!effect) return null;

    // 대상을 따라다니도록 설정
    const effectId = `attached_${key}_${Date.now()}_${Math.random()}`;
    this.activeEffects.set(effectId, {
      sprite: effect,
      key: key,
      target: target,
      startTime: this.scene.time.now,
      duration: duration,
      attached: true,
    });

    return effect;
  }

  /**
   * 부착된 이펙트 제거 (단일 또는 배열)
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Sprite[]} effect - 이펙트 스프라이트 또는 배열
   */
  detachEffect(effect) {
    // 배열인 경우 각각 제거
    if (Array.isArray(effect)) {
      for (const e of effect) {
        this.detachSingleEffect(e);
      }
      return;
    }

    // 단일 이펙트
    this.detachSingleEffect(effect);
  }

  /**
   * 단일 이펙트 제거 (내부 메서드)
   * @param {Phaser.GameObjects.Sprite} effect - 이펙트 스프라이트
   */
  detachSingleEffect(effect) {
    for (const [id, data] of this.activeEffects.entries()) {
      if (data.sprite === effect) {
        this.returnToPool(data.key, effect);
        this.activeEffects.delete(id);
        return;
      }
    }
  }

  getFromPool(key) {
    if (!this.effectPool.has(key)) {
      this.effectPool.set(key, []);
    }

    const pool = this.effectPool.get(key);

    // 풀에서 비활성 상태인 이펙트만 찾기
    for (let i = pool.length - 1; i >= 0; i--) {
      const effect = pool[i];

      // 이펙트가 유효하고 비활성 상태인지 확인
      if (effect && effect.scene && !effect.active && !effect.visible) {
        // 풀에서 제거하고 반환
        pool.splice(i, 1);
        return effect;
      } else if (!effect || !effect.scene) {
        // 유효하지 않은 이펙트는 풀에서 제거
        pool.splice(i, 1);
        if (effect && effect.scene) {
          effect.destroy();
        }
      }
    }

    // 풀에 사용 가능한 이펙트가 없으면 null 반환 (새로 생성)
    return null;
  }

  returnToPool(key, effect) {
    if (!effect || !effect.scene) {
      // 이미 파괴된 이펙트
      return;
    }

    // active effects에서 제거
    for (const [id, data] of this.activeEffects.entries()) {
      if (data.sprite === effect) {
        this.activeEffects.delete(id);
        break;
      }
    }

    // 애니메이션 중지 및 초기화
    if (effect.anims) {
      effect.anims.stop();
    }
    effect.setVisible(false);
    effect.setActive(false);
    effect.setAlpha(1.0);
    effect.setScale(1.0);
    effect.setFlipX(false);
    effect.setAngle(0);
    effect.setRotation(0); // 회전도 초기화
    effect.clearTint(); // 색상 초기화

    if (!this.effectPool.has(key)) {
      this.effectPool.set(key, []);
    }

    const pool = this.effectPool.get(key);
    const maxPoolSize = 20;

    if (pool.length < maxPoolSize) {
      pool.push(effect);
    } else {
      effect.destroy();
    }
  }

  update() {
    const now = this.scene.time.now;

    for (const [id, data] of this.activeEffects.entries()) {
      // 스프라이트가 유효한지 확인
      if (!data.sprite || !data.sprite.active) {
        this.activeEffects.delete(id);
        continue;
      }

      // 부착된 이펙트 위치 갱신
      if (data.attached && data.target) {
        const effectData = EffectData[data.key];
        if (effectData) {
          // flipX 결정: effectData.flipX || target.flipX
          const shouldFlip = effectData.flipX || data.target.flipX;

          const offset = effectData.offset || { x: 0, y: 0 };
          const offsetX = shouldFlip ? -offset.x : offset.x;

          data.sprite.x = data.target.x + offsetX;
          data.sprite.y = data.target.y + offset.y;
          data.sprite.setFlipX(shouldFlip);
        }
      }

      // 지속시간 체크
      if (data.duration !== undefined && data.duration > 0) {
        const elapsed = now - data.startTime;
        if (elapsed >= data.duration) {
          this.returnToPool(data.key, data.sprite);
          this.activeEffects.delete(id);
        }
      }
    }
  }

  clearAllEffects() {
    for (const data of this.activeEffects.values()) {
      this.returnToPool(data.key, data.sprite);
    }
    this.activeEffects.clear();
  }

  destroy() {
    this.clearAllEffects();

    // 풀의 모든 이펙트 제거
    for (const pool of this.effectPool.values()) {
      pool.forEach((effect) => effect.destroy());
    }
    this.effectPool.clear();
    this.loadedEffects.clear();
  }
}
