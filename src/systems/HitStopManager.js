export default class HitstopManager {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.originalTimeScale = 1;
    this.hitstopTimer = null;

    // 히트스톱에서 제외할 객체들 (이펙트, UI 등)
    this.exemptObjects = new Set();

    // 크로마틱 수차 효과용
    this.chromaticShader = null;
    this.chromaticTween = null;

    // 줌 효과용
    this.originalZoom = this.scene.cameras.main.zoom;
  }

  /**
   * 히트스톱 효과 시작 (개선 버전)
   * @param {number} duration - 정지 시간 (밀리초)
   * @param {number} intensity - 강도 (0~1, 0이면 완전 정지, 0.1이면 슬로우모션)
   * @param {Object} options - 추가 옵션
   */
  trigger(duration = 100, intensity = 0, options = {}) {
    if (this.isActive && !options.override) return;
    if (this.isActive) this.stop();

    this.isActive = true;
    const timeScale = intensity;

    // 1. 시간 조절 (기존)
    this.scene.time.timeScale = timeScale;
    this.scene.physics.world.timeScale = 1 / (timeScale || 0.001);
    this.adjustAnimationSpeed(timeScale);

    // 2. 카메라 쉐이크 (개선)
    if (options.shake !== false) {
      // 기본값: true
      const shakeIntensity = options.shakeIntensity || this.getShakeIntensity(duration);
      this.scene.cameras.main.shake(duration * 0.8, shakeIntensity, false);
    }

    // 3. 줌 펄스 효과
    if (options.zoom !== false) {
      // 기본값: true
      this.triggerZoomPulse(duration, options.zoomIntensity || 0.03);
    }

    // 4. 크로마틱 수차 효과
    if (options.chromatic) {
      this.triggerChromaticEffect(duration);
    }

    // 5. 화면 플래시
    if (options.flash) {
      this.triggerFlash(duration, options.flashColor || 0xffffff);
    }

    // 6. 화면 흔들림 방향 설정
    if (options.shakeDirection) {
      this.triggerDirectionalShake(duration, options.shakeDirection);
    }

    // 7. 타이머로 복구 (부드러운 복구 옵션 추가)
    if (options.smoothRecover) {
      this.smoothRecover(duration, timeScale);
    } else {
      this.hitstopTimer = this.scene.time.delayedCall(duration, () => this.stop(), [], this);
    }
  }

  /**
   * 부드러운 복구 (시간이 천천히 정상으로 돌아옴)
   */
  smoothRecover(duration, startScale) {
    const recoverDuration = duration * 0.3; // 복구 시간

    // intensity가 0이면 smoothRecover가 작동 안 하므로 즉시 복구
    if (startScale === 0) {
      this.hitstopTimer = this.scene.time.delayedCall(duration, () => this.stop(), [], this);
      return;
    }

    this.hitstopTimer = this.scene.time.delayedCall(
      duration - recoverDuration,
      () => {
        // 시간 스케일을 부드럽게 1로 복구
        this.scene.tweens.add({
          targets: this.scene.time,
          timeScale: 1,
          duration: recoverDuration,
          ease: 'Cubic.easeOut',
          onUpdate: (tween) => {
            const scale = tween.getValue();
            this.scene.physics.world.timeScale = 1 / (scale || 0.001);
            this.adjustAnimationSpeed(scale);
          },
          onComplete: () => {
            this.stop();
          },
        });
      },
      [],
      this,
    );
  }

  /**
   * 줌 펄스 효과 (살짝 줌인했다가 복구)
   */
  triggerZoomPulse(duration, intensity) {
    const camera = this.scene.cameras.main;
    const targetZoom = this.originalZoom + intensity;

    // 줌인
    this.scene.tweens.add({
      targets: camera,
      zoom: targetZoom,
      duration: duration * 0.2,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        camera.zoom = this.originalZoom;
      },
    });
  }

  /**
   * 크로마틱 수차 효과 (RGB 분리)
   */
  triggerChromaticEffect(duration) {
    const camera = this.scene.cameras.main;

    // 간단한 색상 오프셋으로 크로마틱 효과 시뮬레이션
    const originalTint = camera.backgroundColor;

    this.scene.tweens.add({
      targets: { intensity: 0 },
      intensity: 1,
      duration: duration * 0.3,
      yoyo: true,
      onUpdate: (tween) => {
        const val = tween.getValue();
        // 실제로는 포스트 프로세싱 셰이더가 필요하지만,
        // 간단히 색상 플래시로 대체
        if (val > 0.5) {
          camera.setAlpha(0.95);
        }
      },
      onComplete: () => {
        camera.setAlpha(1);
      },
    });
  }

  /**
   * 화면 플래시 효과
   */
  triggerFlash(duration, color) {
    this.scene.cameras.main.flash(
      duration * 0.5,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
      false,
    );
  }

  /**
   * 방향성 카메라 쉐이크
   */
  triggerDirectionalShake(duration, direction) {
    const camera = this.scene.cameras.main;
    const intensity = 10;

    let offsetX = 0,
      offsetY = 0;

    switch (direction) {
      case 'left':
        offsetX = -intensity;
        break;
      case 'right':
        offsetX = intensity;
        break;
      case 'up':
        offsetY = -intensity;
        break;
      case 'down':
        offsetY = intensity;
        break;
    }

    camera.scrollX += offsetX;
    camera.scrollY += offsetY;

    this.scene.tweens.add({
      targets: camera,
      scrollX: camera.scrollX - offsetX,
      scrollY: camera.scrollY - offsetY,
      duration: duration,
      ease: 'Back.easeOut',
    });
  }

  /**
   * 지속시간에 따른 쉐이크 강도 계산
   */
  getShakeIntensity(duration) {
    if (duration < 80) return 0.003;
    if (duration < 120) return 0.005;
    if (duration < 180) return 0.008;
    return 0.012;
  }

  /**
   * 히트스톱 즉시 종료
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;

    // 시간 복구
    this.scene.time.timeScale = 1;
    this.scene.physics.world.timeScale = 1;

    // 애니메이션 속도 복구
    this.adjustAnimationSpeed(1);

    // 줌 복구
    this.scene.cameras.main.zoom = this.originalZoom;

    // 타이머 정리
    if (this.hitstopTimer) {
      this.hitstopTimer.remove();
      this.hitstopTimer = null;
    }

    // 트윈 정리
    if (this.chromaticTween) {
      this.chromaticTween.stop();
      this.chromaticTween = null;
    }
  }

  /**
   * 애니메이션 속도 조절 (제외 대상 제외)
   */
  adjustAnimationSpeed(scale) {
    this.scene.children.list.forEach((child) => {
      if (child.anims && !this.exemptObjects.has(child)) {
        child.anims.timeScale = scale;
      }
    });
  }

  /**
   * 히트스톱 효과에서 제외할 객체 추가 (이펙트, UI 등)
   */
  addExemption(gameObject) {
    this.exemptObjects.add(gameObject);
    // 현재 히트스톱 중이면 즉시 복구
    if (this.isActive && gameObject.anims) {
      gameObject.anims.timeScale = 1;
    }
  }

  /**
   * 제외 목록에서 제거
   */
  removeExemption(gameObject) {
    this.exemptObjects.delete(gameObject);
  }

  /**
   * 개선된 프리셋
   */
  static PRESETS = {
    // 가벼운 타격 - 빠르고 부드러운 느낌
    LIGHT: {
      duration: 60,
      intensity: 0.3,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.015,
    },

    // 중간 타격 - 명확한 타격감
    MEDIUM: {
      duration: 100,
      intensity: 0.1,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.025,
      shake: true,
    },

    // 강한 타격 - 강력한 임팩트
    HEAVY: {
      duration: 150,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.04,
      flash: true,
      flashColor: 0xffffff,
    },

    // 크리티컬 - 최대 임팩트
    CRITICAL: {
      duration: 200,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.015,
      zoom: true,
      zoomIntensity: 0.05,
      flash: true,
      flashColor: 0xff6666,
      chromatic: true,
    },

    // 슬래시 - 방향성 있는 타격
    SLASH_RIGHT: {
      duration: 80,
      intensity: 0.2,
      smoothRecover: true,
      shakeDirection: 'right',
      zoom: true,
      zoomIntensity: 0.02,
    },

    // 다운 스매시 - 아래로 내리치는 타격
    SMASH_DOWN: {
      duration: 120,
      intensity: 0.05,
      smoothRecover: true,
      shakeDirection: 'down',
      shake: true,
      zoom: true,
      zoomIntensity: 0.035,
    },
  };

  /**
   * 프리셋을 사용한 히트스톱
   */
  triggerPreset(presetName) {
    const preset = HitstopManager.PRESETS[presetName];
    if (preset) {
      this.trigger(preset.duration, preset.intensity, preset);
    } else {
      console.warn(`Hitstop preset not found: ${presetName}`);
    }
  }

  /**
   * 연타 공격용 - 점점 강해지는 히트스톱
   */
  triggerCombo(comboCount) {
    const presets = ['LIGHT', 'LIGHT', 'MEDIUM', 'MEDIUM', 'HEAVY'];
    const presetName = presets[Math.min(comboCount - 1, presets.length - 1)];
    this.triggerPreset(presetName);
  }

  /**
   * 정리
   */
  destroy() {
    this.stop();
    this.exemptObjects.clear();
  }
}
