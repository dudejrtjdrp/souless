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
        skillHitboxes[name] = {
          size: { width: skill.hitbox.width, height: skill.hitbox.height },
          offset: { x: skill.hitbox.offsetX || 0, y: skill.hitbox.offsetY || 0 },
          duration: skill.duration,
          damage: skill.damage,
          knockback: skill.knockback || { x: 0, y: 0 }, // 기본값 추가
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
