// ===========================
// systems/Effects/BossDefeatAnimations.js
// ===========================

export class BossDefeatAnimations {
  /**
   * 보스 처치 연출 (줌인 + 슬로우)
   * @param {Phaser.Scene} scene - Phaser 씬
   * @param {Phaser.Physics.Arcade.Sprite} bossSprite - 보스 스프라이트
   * @param {number} duration - 연출 총 지속시간 (ms)
   */
  static async playBossDefeatCinematic(scene, bossSprite, duration = 2500) {
    const camera = scene.cameras.main;
    const bossX = bossSprite.x;
    const bossY = bossSprite.y;

    console.log('🎬 보스 처치 연출 시작');

    // ✅ 1단계: 슬로우 모션 시작 (0.3배 속도)
    scene.time.timeScale = 0.3;

    // ✅ 2단계: 카메라 줌인 (1.2배로 감소)
    scene.tweens.add({
      targets: camera,
      zoom: 1.2,
      duration: 600,
      ease: 'Power2.easeInOut',
    });

    // 카메라 이동 (보스 중심으로)
    scene.tweens.add({
      targets: camera,
      scrollX: bossX - camera.width / 2,
      scrollY: bossY - camera.height / 2,
      duration: 600,
      ease: 'Power2.easeInOut',
    });

    // ✅ 3단계: 보스 폭발 효과
    this.playBossExplosionEffect(scene, bossX, bossY);

    // ✅ 4단계: 화면 플래시
    camera.flash(300, 255, 200, 100);

    // ✅ 5단계: 보스 스프라이트 소멸 (점진적)
    scene.tweens.add({
      targets: bossSprite,
      alpha: 0,
      scale: 0.5,
      duration: 800,
      delay: 300,
      ease: 'Back.easeIn',
    });

    // ✅ 2초 대기 (슬로우 상태에서)
    await this.delay(scene, 2000);

    // ✅ 6단계: 슬로우 모션 종료
    scene.time.timeScale = 1;

    // ✅ 7단계: 카메라 줌 아웃 + VHS 효과
    scene.tweens.add({
      targets: camera,
      zoom: 1,
      duration: 500,
      ease: 'Power2.easeOut',
    });

    // 플레이어 중심으로 복귀
    if (scene.player?.sprite) {
      scene.tweens.add({
        targets: camera,
        scrollX: scene.player.sprite.x - camera.width / 2,
        scrollY: scene.player.sprite.y - camera.height / 2,
        duration: 500,
        ease: 'Power2.easeOut',
      });
    }

    await this.delay(scene, 300);

    console.log('🎬 보스 처치 연출 완료');
  }

  /**
   * Semi-Boss 처치 연출 (더 강한 효과)
   * @param {Phaser.Scene} scene - Phaser 씬
   * @param {Phaser.Physics.Arcade.Sprite} bossSprite - Semi-Boss 스프라이트
   * @param {number} duration - 연출 총 지속시간 (ms)
   */
  static async playSemiBossDefeatCinematic(scene, bossSprite, duration = 3000) {
    const camera = scene.cameras.main;
    const bossX = bossSprite.x;
    const bossY = bossSprite.y;

    console.log('🎬 Semi-Boss 처치 연출 시작');

    // ✅ 1단계: 슬로우 모션 시작 (85% 슬로우)
    scene.time.timeScale = 0.15;

    // ✅ 2단계: 카메라 줌인 (더 크게)
    scene.tweens.add({
      targets: camera,
      zoom: 1.8,
      duration: 800,
      ease: 'Power2.easeInOut',
    });

    scene.tweens.add({
      targets: camera,
      scrollX: bossX - camera.width / 2,
      scrollY: bossY - camera.height / 2,
      duration: 800,
      ease: 'Power2.easeInOut',
    });

    // ✅ 3단계: 거대한 폭발 효과
    this.playSemiBossExplosionEffect(scene, bossX, bossY);

    // ✅ 4단계: 화면 플래시 (더 강함)
    camera.flash(600, 255, 255, 200);

    // ✅ 5단계: 보스 스프라이트 소멸
    scene.tweens.add({
      targets: bossSprite,
      alpha: 0,
      scale: 0.3,
      duration: 1200,
      delay: 300,
      ease: 'Back.easeIn',
    });

    // ✅ 6단계: 거대한 충격파
    const shockwave = scene.add.circle(bossX, bossY, 20, 0xffffff, 0.9);
    scene.tweens.add({
      targets: shockwave,
      radius: 250,
      alpha: 0,
      duration: 800,
      ease: 'Power3.easeOut',
      onComplete: () => shockwave.destroy(),
    });

    // ✅ 7단계: 강한 화면 진동
    camera.shake(800, 0.05);

    // ✅ 지정된 시간 대기 (슬로우 상태에서)
    const timeScaleFactor = 1 / 0.15; // 0.15배 속도이므로 약 6.67배 대기
    await this.delay(scene, duration * timeScaleFactor);

    // ✅ 8단계: 슬로우 모션 종료 + 카메라 원위치
    scene.time.timeScale = 1;

    scene.tweens.add({
      targets: camera,
      zoom: 1,
      duration: 600,
      ease: 'Power2.easeOut',
    });

    scene.tweens.add({
      targets: camera,
      scrollX: scene.player.sprite.x - camera.width / 2,
      scrollY: scene.player.sprite.y - camera.height / 2,
      duration: 600,
      ease: 'Power2.easeOut',
    });

    await this.delay(scene, 700);

    console.log('🎬 Semi-Boss 처치 연출 완료');
  }

  /**
   * 보스 폭발 효과
   * @param {Phaser.Scene} scene
   * @param {number} x - 폭발 중심 X
   * @param {number} y - 폭발 중심 Y
   */
  static playBossExplosionEffect(scene, x, y) {
    // 파티클 폭발 (중앙)
    const explosion = scene.add.particles(x, y, {
      speed: { min: -200, max: 200 },
      angle: { min: 240, max: 300 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1200,
      gravityY: 100,
      emitZone: { type: 'ellipse', source: new Phaser.Geom.Ellipse(0, 0, 40, 40) },
      blendMode: 'ADD',
      tint: [0xff6600, 0xff3300, 0xffaa00],
    });

    explosion.emitParticleAt(x, y, 80);

    // 파티클 소멸
    scene.time.delayedCall(1200, () => explosion.destroy());

    // 추가 충격파 효과 (흰색 원형)
    const shockwave = scene.add.circle(x, y, 10, 0xffffff, 0.8);
    scene.tweens.add({
      targets: shockwave,
      radius: 150,
      alpha: 0,
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => shockwave.destroy(),
    });

    // 화면 진동 (강함)
    scene.cameras.main.shake(600, 0.03);
  }

  /**
   * Semi-Boss 거대 폭발 효과
   * @param {Phaser.Scene} scene
   * @param {number} x - 폭발 중심 X
   * @param {number} y - 폭발 중심 Y
   */
  static playSemiBossExplosionEffect(scene, x, y) {
    // 거대한 파티클 폭발
    const explosion = scene.add.particles(x, y, {
      speed: { min: -300, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      lifespan: 1400,
      gravityY: 50,
      emitZone: { type: 'ellipse', source: new Phaser.Geom.Ellipse(0, 0, 60, 60) },
      blendMode: 'ADD',
      tint: [0xff0000, 0xff6600, 0xffaa00, 0xffff00],
    });

    explosion.emitParticleAt(x, y, 150);

    // 파티클 소멸
    scene.time.delayedCall(1400, () => explosion.destroy());

    // 화면 진동 (매우 강함)
    scene.cameras.main.shake(1000, 0.05);
  }

  /**
   * Promise 기반 딜레이
   * @param {Phaser.Scene} scene
   * @param {number} ms - 밀리초
   */
  static delay(scene, ms) {
    return new Promise((resolve) => {
      scene.time.delayedCall(ms, resolve);
    });
  }
}
