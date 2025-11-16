import { PRESETS } from '../config/hitStopPresets';

export default class HitstopManager {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.hitstopTimer = null;
    this.originalZoom = this.scene.cameras.main.zoom;
  }

  /**
   * 히트스톱 효과 시작 (단순화 버전)
   * @param {number} duration - 정지 시간 (밀리초)
   * @param {number} intensity - 강도 (0~1, 0이면 완전 정지, 0.1이면 슬로우모션)
   * @param {Object} options - 추가 옵션
   */
  trigger(duration = 100, intensity = 0, options = {}) {
    if (this.isActive && !options.override) return;
    if (this.isActive) this.stop();

    this.isActive = true;
    const timeScale = intensity;

    // 전체 게임 시간을 느리게 (애니메이션, 타이머, 히트박스 모두 포함)
    this.scene.time.timeScale = timeScale;

    // 카메라 쉐이크
    if (options.shake !== false) {
      const shakeIntensity = options.shakeIntensity || this.getShakeIntensity(duration);
      this.scene.cameras.main.shake(duration * 0.8, shakeIntensity, false);
    }

    // 줌 펄스 효과
    if (options.zoom !== false) {
      this.triggerZoomPulse(duration, options.zoomIntensity || 0.03);
    }

    // 크로마틱 수차 효과
    if (options.chromatic) {
      this.triggerChromaticEffect(duration);
    }

    // 화면 플래시
    if (options.flash) {
      this.triggerFlash(duration, options.flashColor || 0xffffff);
    }

    // 화면 흔들림 방향 설정
    if (options.shakeDirection) {
      this.triggerDirectionalShake(duration, options.shakeDirection);
    }

    // 부드러운 복구
    if (options.smoothRecover && timeScale > 0) {
      this.smoothRecover(duration, timeScale);
    } else {
      // 실시간 타이머로 복구 (게임 시간에 영향받지 않음)
      this.hitstopTimer = setTimeout(() => this.stop(), duration);
    }
  }

  /**
   * 부드러운 복구 (시간이 천천히 정상으로 돌아옴)
   */
  smoothRecover(duration, startScale) {
    const recoverDuration = duration * 0.3;

    this.hitstopTimer = setTimeout(() => {
      this.scene.tweens.add({
        targets: this.scene.time,
        timeScale: 1,
        duration: recoverDuration,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.stop();
        },
      });
    }, duration - recoverDuration);
  }

  /**
   * 줌 펄스 효과 (살짝 줌인했다가 복구)
   */
  triggerZoomPulse(duration, intensity) {
    const camera = this.scene.cameras.main;
    const targetZoom = this.originalZoom + intensity;

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

    this.scene.tweens.add({
      targets: { intensity: 0 },
      intensity: 1,
      duration: duration * 0.3,
      yoyo: true,
      onUpdate: (tween) => {
        const val = tween.getValue();
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

    // 게임 시간 정상 속도로
    this.scene.time.timeScale = 1;

    // 줌 복구
    this.scene.cameras.main.zoom = this.originalZoom;

    // 타이머 정리
    if (this.hitstopTimer) {
      clearTimeout(this.hitstopTimer);
      this.hitstopTimer = null;
    }
  }

  /**
   * 프리셋을 사용한 히트스톱
   */
  triggerPreset(presetName) {
    const preset = PRESETS[presetName];
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
  }
}
