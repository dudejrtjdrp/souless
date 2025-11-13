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

    // 7. 실시간 타이머로 복구 (timeScale에 영향받지 않음)
    if (options.smoothRecover && timeScale > 0) {
      this.smoothRecover(duration, timeScale);
    } else {
      // setTimeout 사용 (scene.time.delayedCall은 timeScale 영향을 받음!)
      this.hitstopTimer = setTimeout(() => this.stop(), duration);
    }
  }

  /**
   * 부드러운 복구 (시간이 천천히 정상으로 돌아옴)
   */
  smoothRecover(duration, startScale) {
    const recoverDuration = duration * 0.3; // 복구 시간

    // setTimeout 사용 (실시간 타이머)
    this.hitstopTimer = setTimeout(() => {
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
    }, duration - recoverDuration);
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

    // 타이머 정리 (setTimeout 사용)
    if (this.hitstopTimer) {
      clearTimeout(this.hitstopTimer);
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

  static PRESETS = {
    // ============================================
    // 기본 타격 (Basic Hits)
    // ============================================

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

    // ============================================
    // 방향성 타격 (Directional Hits)
    // ============================================

    // 슬래시 - 오른쪽
    SLASH_RIGHT: {
      duration: 80,
      intensity: 0.2,
      smoothRecover: true,
      shakeDirection: 'right',
      zoom: true,
      zoomIntensity: 0.02,
    },

    // 슬래시 - 왼쪽
    SLASH_LEFT: {
      duration: 80,
      intensity: 0.2,
      smoothRecover: true,
      shakeDirection: 'left',
      zoom: true,
      zoomIntensity: 0.02,
    },

    // 어퍼컷 - 위로
    UPPERCUT: {
      duration: 140,
      intensity: 0.05,
      smoothRecover: true,
      shakeDirection: 'up',
      shake: true,
      zoom: true,
      zoomIntensity: 0.035,
      flash: true,
      flashColor: 0xffaa00,
    },

    // 다운 스매시 - 아래로
    SMASH_DOWN: {
      duration: 120,
      intensity: 0.05,
      smoothRecover: true,
      shakeDirection: 'down',
      shake: true,
      zoom: true,
      zoomIntensity: 0.035,
    },

    // ============================================
    // 특수 공격 (Special Attacks)
    // ============================================

    // 관통 - 빠르고 날카로운
    PIERCE: {
      duration: 70,
      intensity: 0.25,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.02,
      flash: true,
      flashColor: 0x00ffff,
    },

    // 폭발 - 광역 임팩트
    EXPLOSION: {
      duration: 180,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.02,
      zoom: true,
      zoomIntensity: 0.06,
      flash: true,
      flashColor: 0xff8800,
      chromatic: true,
    },

    // 카운터 - 반격
    COUNTER: {
      duration: 110,
      intensity: 0.15,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.03,
      flash: true,
      flashColor: 0xffff00,
    },

    // 백스탭 - 가볍게 밀어내기
    BACKSTAB: {
      duration: 130,
      intensity: 0.1,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.04,
      flash: true,
      flashColor: 0xff0000,
    },

    // 마법 타격
    MAGIC_HIT: {
      duration: 90,
      intensity: 0.2,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.025,
      flash: true,
      flashColor: 0x9966ff,
      chromatic: true,
    },

    // ============================================
    // 연속 공격 (Combo Attacks)
    // ============================================

    // 콤보 1타 - 시작
    COMBO_1: {
      duration: 50,
      intensity: 0.35,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.01,
    },

    // 콤보 2타
    COMBO_2: {
      duration: 60,
      intensity: 0.3,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.015,
    },

    // 콤보 3타
    COMBO_3: {
      duration: 80,
      intensity: 0.2,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.02,
    },

    // 콤보 4타
    COMBO_4: {
      duration: 100,
      intensity: 0.1,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.03,
      flash: true,
      flashColor: 0xffffff,
    },

    // 콤보 피니셔 - 마지막 타격
    COMBO_FINISHER: {
      duration: 160,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.012,
      zoom: true,
      zoomIntensity: 0.045,
      flash: true,
      flashColor: 0xffaa00,
      chromatic: true,
    },

    // ============================================
    // 원소 속성 (Elemental)
    // ============================================

    // 불 속성
    FIRE: {
      duration: 110,
      intensity: 0.15,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.03,
      flash: true,
      flashColor: 0xff4400,
    },

    // 얼음 속성
    ICE: {
      duration: 130,
      intensity: 0,
      smoothRecover: false, // 얼음은 급격히 멈춤
      shake: true,
      zoom: true,
      zoomIntensity: 0.025,
      flash: true,
      flashColor: 0x00ccff,
    },

    // 번개 속성
    LIGHTNING: {
      duration: 70,
      intensity: 0.3,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.02,
      flash: true,
      flashColor: 0xffff00,
      chromatic: true,
    },

    // 독 속성
    POISON: {
      duration: 85,
      intensity: 0.25,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.015,
      flash: true,
      flashColor: 0x88ff00,
    },

    // 암흑 속성
    DARK: {
      duration: 120,
      intensity: 0.1,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.035,
      flash: true,
      flashColor: 0x660099,
      chromatic: true,
    },

    // 신성 속성
    HOLY: {
      duration: 95,
      intensity: 0.2,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.028,
      flash: true,
      flashColor: 0xffffaa,
    },

    // ============================================
    // 무기 타입 (Weapon Types)
    // ============================================

    // 검 - 날카로운 베기
    SWORD_SLASH: {
      duration: 85,
      intensity: 0.2,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.022,
      flash: true,
      flashColor: 0xaaaaaa,
    },

    // 둔기 - 무거운 타격
    BLUNT: {
      duration: 140,
      intensity: 0.05,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.01,
      zoom: true,
      zoomIntensity: 0.038,
    },

    // 창 - 찌르기
    SPEAR_THRUST: {
      duration: 75,
      intensity: 0.25,
      smoothRecover: true,
      shakeDirection: 'right',
      zoom: true,
      zoomIntensity: 0.018,
    },

    // 활 - 화살 명중
    ARROW_HIT: {
      duration: 65,
      intensity: 0.3,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.015,
    },

    // 총 - 총알 명중
    GUNSHOT: {
      duration: 55,
      intensity: 0.35,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.012,
      flash: true,
      flashColor: 0xffaa00,
    },

    // ============================================
    // 상태 효과 (Status Effects)
    // ============================================

    // 기절
    STUN: {
      duration: 180,
      intensity: 0,
      smoothRecover: false,
      shake: true,
      shakeIntensity: 0.018,
      zoom: true,
      zoomIntensity: 0.045,
      flash: true,
      flashColor: 0xffff00,
    },

    // 넉백 - 밀쳐내기
    KNOCKBACK: {
      duration: 120,
      intensity: 0.1,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.032,
    },

    // 다운 - 쓰러트리기
    KNOCKDOWN: {
      duration: 200,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.02,
      zoom: true,
      zoomIntensity: 0.055,
      flash: true,
      flashColor: 0xff6666,
      chromatic: true,
    },

    // ============================================
    // 보스 전용 (Boss Attacks)
    // ============================================

    // 보스 일반 공격
    BOSS_NORMAL: {
      duration: 130,
      intensity: 0.08,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.012,
      zoom: true,
      zoomIntensity: 0.04,
      flash: true,
      flashColor: 0xff0000,
    },

    // 보스 강공격
    BOSS_HEAVY: {
      duration: 220,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.025,
      zoom: true,
      zoomIntensity: 0.07,
      flash: true,
      flashColor: 0xff0000,
      chromatic: true,
    },

    // 보스 필살기
    BOSS_ULTIMATE: {
      duration: 300,
      intensity: 0,
      smoothRecover: false,
      shake: true,
      shakeIntensity: 0.03,
      zoom: true,
      zoomIntensity: 0.1,
      flash: true,
      flashColor: 0xff0066,
      chromatic: true,
    },

    // ============================================
    // 기타 (Miscellaneous)
    // ============================================

    // 회피 성공 (잔상 효과)
    DODGE_SUCCESS: {
      duration: 40,
      intensity: 0.4,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.008,
    },

    // 패리 성공
    PARRY_SUCCESS: {
      duration: 90,
      intensity: 0.2,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.025,
      flash: true,
      flashColor: 0x00ffff,
    },

    // 가드 브레이크
    GUARD_BREAK: {
      duration: 160,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.015,
      zoom: true,
      zoomIntensity: 0.05,
      flash: true,
      flashColor: 0xffaa00,
    },

    // 치명타 (크리티컬보다 약간 약함)
    CRIT_HIT: {
      duration: 170,
      intensity: 0,
      smoothRecover: true,
      shake: true,
      shakeIntensity: 0.013,
      zoom: true,
      zoomIntensity: 0.048,
      flash: true,
      flashColor: 0xffff00,
      chromatic: true,
    },

    // 약점 공격
    WEAK_POINT: {
      duration: 140,
      intensity: 0.05,
      smoothRecover: true,
      shake: true,
      zoom: true,
      zoomIntensity: 0.042,
      flash: true,
      flashColor: 0xff66ff,
    },

    // 극히 가벼운 타격 (그레이즈)
    GRAZE: {
      duration: 30,
      intensity: 0.5,
      smoothRecover: true,
      zoom: false,
    },

    // 무효화 (미스/블록)
    NULLIFIED: {
      duration: 50,
      intensity: 0.4,
      smoothRecover: true,
      zoom: true,
      zoomIntensity: 0.01,
      flash: true,
      flashColor: 0xaaaaaa,
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
