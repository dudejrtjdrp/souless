// characters/systems/AnimationManager.js

/**
 * AnimationManager
 *
 * - 캐릭터별 스프라이트 시트 애니메이션을 생성 및 제어하는 클래스
 * - 기존 구조 유지 + pause(), resume(), stop() 기능 통합
 * - 애니메이션 중복 재생 방지 / 존재하지 않는 애니메이션 예외 처리 포함
 */

export default class AnimationManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * 모든 애니메이션을 Phaser 애니메이션 매니저에 등록
   * 이미 등록된 애니메이션은 중복 생성하지 않음
   */
  createAll() {
    const { spriteKey, animations } = this.config;

    animations.forEach((anim) => {
      // 이미 존재하는 애니메이션은 건너뛰기
      const animKey = `${spriteKey}-${anim.key}`;

      if (this.scene.anims.exists(animKey)) {
        return;
      }

      // 애니메이션 생성
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(spriteKey, {
          start: anim.frames.start,
          end: anim.frames.end,
        }),
        frameRate: anim.frameRate,
        repeat: anim.repeat ?? 0, // 기본 1회 재생
      });
    });
  }

  /**
   * 지정된 스프라이트에 애니메이션 재생
   * 이미 동일한 애니메이션이 재생 중이면 무시
   */
  play(sprite, animKey, ignoreIfPlaying = true) {
    if (!sprite || !animKey) return;

    const fullKey = `${this.config.spriteKey}-${animKey}`;

    // 애니메이션 존재 여부 확인
    if (!this.scene.anims.exists(fullKey)) {
      console.error(`[AnimationManager] Animation not found: ${fullKey}`);
      return;
    }

    // 이미 같은 애니메이션이 재생 중이면 무시
    if (ignoreIfPlaying && sprite.anims.currentAnim?.key === fullKey && sprite.anims.isPlaying) {
      return;
    }

    try {
      sprite.anims.play(fullKey, true);
    } catch (err) {
      console.error(`[AnimationManager] Failed to play animation: ${fullKey}`, err);
    }
  }

  /**
   * 애니메이션 일시정지 (pause)
   * 현재 재생 중인 애니메이션이 있는 경우에만 동작
   */
  pause(sprite) {
    if (!sprite?.anims) return;
    if (!sprite.anims.isPlaying) return;

    try {
      sprite.anims.pause();
    } catch (err) {
      console.error('[AnimationManager] Failed to pause animation', err);
    }
  }

  /**
   * 일시정지된 애니메이션 재개 (resume)
   */
  resume(sprite) {
    if (!sprite?.anims) return;

    try {
      sprite.anims.resume();
    } catch (err) {
      console.error('[AnimationManager] Failed to resume animation', err);
    }
  }

  /**
   * 애니메이션 정지 (stop)
   * 현재 재생 중인 애니메이션이 있는 경우에만 중단
   */
  stop(sprite) {
    if (!sprite?.anims) return;

    try {
      sprite.anims.stop();
    } catch (err) {
      console.error('[AnimationManager] Failed to stop animation', err);
    }
  }

  /**
   * 애니메이션 존재 여부 확인
   */
  exists(animKey) {
    const fullKey = `${this.config.spriteKey}-${animKey}`;
    return this.scene.anims.exists(fullKey);
  }

  /**
   * 현재 재생 중인 애니메이션 키 반환
   */
  getCurrentKey(sprite) {
    if (!sprite?.anims?.currentAnim) return null;
    return sprite.anims.currentAnim.key;
  }

  /**
   * 현재 애니메이션이 재생 중인지 여부 반환
   */
  isPlaying(sprite) {
    return !!sprite?.anims?.isPlaying;
  }

  /**
   * 현재 애니메이션이 일시정지 상태인지 여부 반환
   */
  isPaused(sprite) {
    return !!sprite?.anims?.paused;
  }
}
