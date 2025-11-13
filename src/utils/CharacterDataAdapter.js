import { CharacterData } from '../config/characterData.js';
import HitboxConfig from '../config/HitBoxConfig.js';

/**
 * CharacterData를 HitboxConfig 형식으로 변환
 * 기존 characterData.js를 계속 사용하면서 새로운 시스템과 호환
 */
export class CharacterDataAdapter {
  /**
   * CharacterData를 읽어서 CharacterBase가 사용할 config로 변환
   */
  static buildConfig(characterType, options = {}) {
    const data = CharacterData[characterType];
    if (!data) {
      throw new Error(`Character data not found: ${characterType}`);
    }

    // ✅ 충돌 박스 변환
    const collisionBox = HitboxConfig.createCollisionBox(
      data.physics.collisionBox.width,
      data.physics.collisionBox.height,
      data.physics.collisionBox.offsetX || 0,
      data.physics.collisionBox.offsetY || 0,
    );

    // ✅ 기본 공격 히트박스 변환
    const attackHitbox = HitboxConfig.createAttackHitbox(
      data.combat.attackHitbox.width,
      data.combat.attackHitbox.height,
      data.combat.attackHitbox.offsetX,
      data.combat.attackHitbox.offsetY,
      data.combat.attackHitbox.duration,
    );

    // ✅ 스킬 히트박스 변환
    const skillHitboxes = {};
    if (data.skills) {
      for (const [skillName, skillData] of Object.entries(data.skills)) {
        // duration을 frameRate와 프레임 수로 계산
        let duration = 400; // 기본값
        if (skillData.animation) {
          const animData = data.animations.find((anim) => anim.key === skillData.animation);
          if (animData) {
            const frameRate = animData.frameRate || 10;
            const frameCount = animData.frames.end - animData.frames.start + 1;
            duration = (frameCount / frameRate) * 1000;
          }
        }

        skillHitboxes[skillName] = HitboxConfig.createSkillHitbox(skillName, {
          size: skillData.hitbox
            ? { width: skillData.hitbox.width, height: skillData.hitbox.height }
            : { width: 0, height: 0 },
          offset: skillData.hitbox
            ? { x: skillData.hitbox.offsetX || 0, y: skillData.hitbox.offsetY || 0 }
            : { x: 0, y: 0 },
          duration: duration,
          damage: skillData.damage || 0,
          knockback: skillData.knockback || { x: 0, y: 0 },
          effects: skillData.effects || [],
          invincible: skillData.invincible || false,
        });
      }
    }

    return {
      spriteKey: data.sprite.key,
      spriteScale: options.spriteScale || data.sprite.scale,
      collisionBox,
      attackHitbox,
      skillHitboxes,
      bodyOffset: data.bodyOffset,
      base: data.base,
      walkSpeed: options.walkSpeed || data.physics.walkSpeed,
      runSpeed: options.runSpeed || data.physics.runSpeed,
      jumpPower: options.jumpPower || data.physics.jumpPower,
      maxJumps: options.maxJumps || data.physics.maxJumps,
      debug: options.debug || false,
      _rawData: data,
    };
  }

  /**
   * 애니메이션 설정 가져오기
   */
  static getAnimationConfig(characterType) {
    const data = CharacterData[characterType];
    if (!data) {
      throw new Error(`Character data not found: ${characterType}`);
    }

    return {
      spriteKey: data.sprite.key,
      animations: data.animations,
    };
  }

  /**
   * 스킬 데이터 가져오기 (SkillSystem용)
   */
  static getSkillsData(characterType) {
    const data = CharacterData[characterType];
    if (!data) {
      throw new Error(`Character data not found: ${characterType}`);
    }

    return data.skills;
  }

  /**
   * 애니메이션 duration 계산 헬퍼 메서드
   */
  static calculateAnimationDuration(characterType, animationKey) {
    const data = CharacterData[characterType];
    if (!data) return 0;

    const animData = data.animations.find((anim) => anim.key === animationKey);
    if (!animData) return 0;

    const frameRate = animData.frameRate || 10;
    const frameCount = animData.frames.end - animData.frames.start + 1;
    return (frameCount / frameRate) * 1000;
  }
}
