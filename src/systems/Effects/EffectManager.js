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
   * 디버그 모드 토글
   */
  setDebug(enabled) {
    this.debug = enabled;
    if (enabled) {
      console.log('EffectManager Debug Mode: ON');
    }
  }

  /**
   * 현재 상태 출력
   */
  logStatus() {
    console.log('=== EffectManager Status ===');
    console.log('Active Effects:', this.activeEffects.size);
    console.log('Pool Status:');
    for (const [key, pool] of this.effectPool.entries()) {
      console.log(`  ${key}: ${pool.length} available`);
    }
    console.log('Loaded Effects:', Array.from(this.loadedEffects));
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

    console.log(`Created placeholder texture for: ${key}`);
  }

  /**
   * 이펙트 스프라이트시트 로드
   * @param {string} key - 이펙트 키
   */
  preloadEffect(key) {
    const data = EffectData[key];
    if (!data) {
      console.warn(`Effect data not found: ${key}`);
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
        console.warn(`Failed to load effect: ${key}, using placeholder`);
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

    this.scene.anims.create({
      key: key,
      frames: this.scene.anims.generateFrameNumbers(key, {
        start: data.frames.start,
        end: data.frames.end,
      }),
      frameRate: data.frameRate,
      repeat: data.repeat,
    });

    if (this.debug) {
      console.log(`Created animation: ${key}`);
    }
  }

  /**
   * 이펙트 재생
   * @param {string} key - 이펙트 키
   * @param {number} x - X 위치
   * @param {number} y - Y 위치
   * @param {boolean} flipX - X축 반전 여부
   * @param {Object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Sprite} - 생성된 이펙트 스프라이트
   */
  playEffect(key, x, y, flipX = false, options = {}) {
    const data = EffectData[key];
    if (!data) {
      console.warn(`Effect data not found for key: ${key}`);
      return null;
    }

    // 텍스처가 로드되어 있는지 확인
    if (!this.scene.textures.exists(key)) {
      console.warn(`Effect texture not loaded: ${key}`);
      return null;
    }

    // 애니메이션이 생성되어 있지 않으면 자동으로 생성
    if (!this.scene.anims.exists(key)) {
      console.log(`Auto-creating animation for: ${key}`);
      this.createEffectAnimation(key);
    }

    // 풀에서 재사용 가능한 이펙트 찾기
    let effect = this.getFromPool(key);

    if (!effect) {
      // 새로 생성
      try {
        effect = this.scene.add.sprite(0, 0, key);
      } catch (error) {
        console.error(`Failed to create sprite for effect: ${key}`, error);
        return null;
      }

      // 애니메이션 완료 시 처리
      effect.on('animationcomplete', () => {
        if (data.repeat === 0) {
          // 반복하지 않는 이펙트만
          this.returnToPool(key, effect);
        }
      });
    }

    // 오프셋 계산 (flipX 고려)
    const offset = data.offset || { x: 0, y: 0 };
    const finalX = flipX ? x - offset.x : x + offset.x;
    const finalY = y + offset.y;

    // 위치 설정 (오프셋 적용된 최종 위치)
    effect.setPosition(finalX, finalY);
    effect.setVisible(true);
    effect.setActive(true);

    // 스케일 및 반전 설정
    const scale = options.scale || data.scale || 1.0;
    effect.setScale(scale);
    effect.setFlipX(flipX);

    // 알파값 설정
    effect.setAlpha(data.alpha !== undefined ? data.alpha : 1.0);

    // 깊이 설정 (캐릭터 위에 표시)
    effect.setDepth(options.depth || 100);

    // 애니메이션 재생 (처음부터 재시작)
    try {
      effect.anims.stop();
      effect.anims.play(key, true); // true로 강제 재시작
    } catch (error) {
      console.error(`Failed to play animation for effect: ${key}`, error);
      effect.destroy();
      return null;
    }

    // 활성 이펙트로 등록
    const effectId = `${key}_${Date.now()}_${Math.random()}`;
    this.activeEffects.set(effectId, {
      sprite: effect,
      key: key,
      startTime: this.scene.time.now,
      flipX: flipX, // flipX 저장
    });

    if (this.debug) {
      console.log(`Playing effect: ${key} at (${finalX}, ${finalY}), flipX: ${flipX}`);
    }

    return effect;
  }

  /**
   * 히트박스 위치에 이펙트 재생
   * @param {string} key - 이펙트 키
   * @param {Phaser.GameObjects.Rectangle} hitbox - 히트박스
   * @param {boolean} flipX - X축 반전 여부
   * @param {Object} options - 추가 옵션
   */
  playEffectOnHitbox(key, hitbox, flipX = false, options = {}) {
    if (!hitbox) {
      console.warn('Hitbox is null or undefined');
      return null;
    }

    // 히트박스의 월드 좌표 가져오기
    const worldX = hitbox.x;
    const worldY = hitbox.y;

    if (this.debug) {
      console.log(`Playing effect on hitbox: ${key} at (${worldX}, ${worldY}), flipX: ${flipX}`);
    }

    return this.playEffect(key, worldX, worldY, flipX, options);
  }

  /**
   * 특정 대상에 이펙트 부착 (따라다니는 이펙트)
   * @param {string} key - 이펙트 키
   * @param {Phaser.GameObjects.Sprite} target - 대상 스프라이트
   * @param {boolean} flipX - X축 반전 여부
   * @param {number} duration - 지속 시간 (ms), undefined면 수동으로 제거해야 함
   */
  attachEffect(key, target, flipX = false, duration = undefined) {
    const data = EffectData[key];
    if (!data || !target) {
      console.warn(`Cannot attach effect: ${key}`);
      return null;
    }

    const effect = this.playEffect(key, target.x, target.y, flipX);
    if (!effect) return null;

    // 대상을 따라다니도록 설정
    const effectId = `attached_${key}_${Date.now()}`;
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
   * 부착된 이펙트 제거
   * @param {Phaser.GameObjects.Sprite} effect - 이펙트 스프라이트
   */
  detachEffect(effect) {
    for (const [id, data] of this.activeEffects.entries()) {
      if (data.sprite === effect) {
        this.returnToPool(data.key, effect);
        this.activeEffects.delete(id);
        return;
      }
    }
  }

  /**
   * 풀에서 이펙트 가져오기
   */
  getFromPool(key) {
    if (!this.effectPool.has(key)) {
      this.effectPool.set(key, []);
    }

    const pool = this.effectPool.get(key);
    const effect = pool.pop() || null;

    if (effect && this.debug) {
      console.log(`Got effect from pool: ${key}, remaining in pool: ${pool.length}`);
    }

    return effect;
  }

  /**
   * 풀로 이펙트 반환
   */
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
    effect.anims.stop();
    effect.setVisible(false);
    effect.setActive(false);
    effect.setAlpha(1.0);
    effect.setScale(1.0);
    effect.setFlipX(false);

    if (!this.effectPool.has(key)) {
      this.effectPool.set(key, []);
    }

    const pool = this.effectPool.get(key);
    const maxPoolSize = 20;

    if (pool.length < maxPoolSize) {
      pool.push(effect);
      if (this.debug) {
        console.log(`Returned effect to pool: ${key}, pool size: ${pool.length}`);
      }
    } else {
      if (this.debug) {
        console.log(`Pool full for ${key}, destroying effect`);
      }
      effect.destroy();
    }
  }

  /**
   * 부착된 이펙트 위치 갱신 및 만료 처리
   */
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
          const offset = effectData.offset || { x: 0, y: 0 };
          const offsetX = data.target.flipX ? -offset.x : offset.x;
          data.sprite.x = data.target.x + offsetX;
          data.sprite.y = data.target.y + offset.y;
          data.sprite.setFlipX(data.target.flipX);
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

  /**
   * 모든 이펙트 제거
   */
  clearAllEffects() {
    for (const data of this.activeEffects.values()) {
      this.returnToPool(data.key, data.sprite);
    }
    this.activeEffects.clear();
  }

  /**
   * 정리
   */
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
