import { EffectData } from '../../config/effectData';

export class EffectLoader {
  /**
   * 모든 이펙트 텍스처 로드
   * @param {Phaser.Scene} scene - Phaser Scene
   */
  static preloadAllEffects(scene) {
    for (const [key, data] of Object.entries(EffectData)) {
      scene.load.spritesheet(key, data.url, {
        frameWidth: data.frameWidth,
        frameHeight: data.frameHeight,
      });
    }
  }

  /**
   * 특정 이펙트들만 로드
   * @param {Phaser.Scene} scene - Phaser Scene
   * @param {string[]} effectKeys - 로드할 이펙트 키 배열
   */
  static preloadEffects(scene, effectKeys) {
    for (const key of effectKeys) {
      const data = EffectData[key];
      if (!data) {
        console.warn(`Effect data not found: ${key}`);
        continue;
      }

      scene.load.spritesheet(key, data.url, {
        frameWidth: data.frameWidth,
        frameHeight: data.frameHeight,
      });
    }
  }

  /**
   * 모든 이펙트 애니메이션 생성
   * @param {Phaser.Scene} scene - Phaser Scene
   */
  static createAllAnimations(scene) {
    for (const [key, data] of Object.entries(EffectData)) {
      if (!scene.textures.exists(key)) {
        console.warn(`Texture not loaded, skipping animation: ${key}`);
        continue;
      }

      if (scene.anims.exists(key)) {
        // 이미 생성됨
        continue;
      }

      scene.anims.create({
        key: key,
        frames: scene.anims.generateFrameNumbers(key, {
          start: data.frames.start,
          end: data.frames.end,
        }),
        frameRate: data.frameRate,
        repeat: data.repeat,
      });
    }
  }

  /**
   * 캐릭터 스킬 데이터에서 필요한 이펙트 추출
   * @param {Object} characterData - 캐릭터 데이터
   * @returns {Set<string>} - 이펙트 키 Set
   */
  static extractEffectKeys(characterData) {
    const effectKeys = new Set();

    if (!characterData.skills) return effectKeys;

    for (const config of Object.values(characterData.skills)) {
      // 단일 히트박스의 이펙트
      if (config.hitbox) {
        const hitboxArray = Array.isArray(config.hitbox) ? config.hitbox : [config.hitbox];
        hitboxArray.forEach((hb) => {
          if (hb.effect) effectKeys.add(hb.effect);
        });
      }

      // 시퀀스 히트박스의 이펙트
      if (config.hitboxSequence) {
        config.hitboxSequence.forEach((step) => {
          if (step.effect) effectKeys.add(step.effect);
          if (step.hitbox?.effect) effectKeys.add(step.hitbox.effect);
        });
      }

      // 임팩트 이펙트
      if (config.impactEffect) effectKeys.add(config.impactEffect);

      // 대시/힐 이펙트
      if (config.dashEffect) effectKeys.add(config.dashEffect);
      if (config.healEffect) effectKeys.add(config.healEffect);
    }

    return effectKeys;
  }

  /**
   * 모든 캐릭터 데이터에서 필요한 이펙트 추출
   * @param {Object} characterDataMap - 전체 캐릭터 데이터 맵
   * @returns {Set<string>} - 이펙트 키 Set
   */
  static extractAllEffectKeys(characterDataMap) {
    const allEffects = new Set();

    for (const characterData of Object.values(characterDataMap)) {
      const effects = this.extractEffectKeys(characterData);
      effects.forEach((key) => allEffects.add(key));
    }

    return allEffects;
  }
}
