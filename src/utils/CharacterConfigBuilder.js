import { CharacterData } from '../config/characterData.js';

export class CharacterConfigBuilder {
  static build(characterType, options = {}) {
    const data = CharacterData[characterType];
    if (!data) {
      throw new Error(`Character data not found: ${characterType}`);
    }

    const skillHitboxes = {};
    for (const [name, skill] of Object.entries(data.skills)) {
      // hitbox가 있는 스킬만 처리
      if (skill.hitbox) {
        // duration을 frameRate와 프레임 수로 계산
        const animKey = skill.animation;
        const animData = data.animations.find((anim) => anim.key === animKey);
        const frameRate = animData?.frameRate || 10;
        const frameCount = animData ? animData.frames.end - animData.frames.start + 1 : 0;
        const duration = frameCount > 0 ? (frameCount / frameRate) * 1000 : 400;

        skillHitboxes[name] = {
          size: { width: skill.hitbox.width, height: skill.hitbox.height },
          offset: { x: skill.hitbox.offsetX || 0, y: skill.hitbox.offsetY || 0 },
          duration: duration,
          damage: skill.damage,
          knockback: skill.knockback || { x: 0, y: 0 },
          effects: skill.effects || [],
        };
      }
    }

    return {
      spriteKey: data.sprite.key,
      spriteScale: options.spriteScale || data.sprite.scale,
      collisionBox: {
        size: {
          width: data.physics.collisionBox.width,
          height: data.physics.collisionBox.height,
        },
        offset: {
          x: data.physics.collisionBox.offsetX,
          y: data.physics.collisionBox.offsetY,
        },
      },
      attackHitbox: {
        size: {
          width: data.combat.attackHitbox.width,
          height: data.combat.attackHitbox.height,
        },
        offset: {
          x: data.combat.attackHitbox.offsetX,
          y: data.combat.attackHitbox.offsetY,
        },
        duration: data.combat.attackHitbox.duration,
      },
      skillHitboxes,
      walkSpeed: options.walkSpeed || data.physics.walkSpeed,
      runSpeed: options.runSpeed || data.physics.runSpeed,
      jumpPower: options.jumpPower || data.physics.jumpPower,
      maxJumps: options.maxJumps || data.physics.maxJumps,
      debug: !!options.debug,
      _rawData: data,
    };
  }
}
