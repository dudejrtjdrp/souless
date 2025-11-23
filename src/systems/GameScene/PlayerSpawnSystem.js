import CharacterFactory from '../../entities/characters/base/CharacterFactory.js';
import { PortalManager } from '../../controllers/PortalManager.js';

/**
 * 플레이어 스폰 위치 결정 + 생성 + 바닥 스냅
 * GameScene의 스폰 관련 함수들을 통합
 *
 * Y축 기준 (두 가지만 사용):
 * 1. colliderTop: Collider의 윗면 y축 (바닥 collision 최상단)
 * 2. characterBaseY: 캐릭터 기준점 = (하단 + 200px) + offset
 */
export default class PlayerSpawnSystem {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 메인 스폰 메서드
   */
  createPlayer(characterType, options = {}) {
    const { isRespawn = false, respawnHealth = 100 } = options;

    // 1. 스폰 위치 결정 (X축만)
    const spawnX = this.resolveSpawnPositionX(isRespawn);
    const spawnY = this.FIXED_SPAWN_Y;

    // 2. 플레이어 생성
    const player = this.instantiatePlayer(characterType, spawnX, spawnY);

    // 3. 리스폰 체력 적용
    if (isRespawn && respawnHealth) {
      player.health = respawnHealth;
      player.maxHealth = respawnHealth;
    }

    // 4. 스폰 이펙트
    this.applySpawnEffects(player);

    return player;
  }

  /**
   * 캐릭터 스위치용 (현재 X 유지)
   */
  createPlayerForSwitch(characterType, currentX) {
    const player = this.instantiatePlayer(characterType, currentX, this.FIXED_SPAWN_Y);

    this.applySpawnEffects(player);

    return player;
  }

  // ═══════════════════════════════════════════
  // Y축 기준점 계산
  // ═══════════════════════════════════════════

  /**
   * 고정된 스폰 Y축
   * = Collider 윗면 + 캐릭터 offset
   * = (맵 높이 - 200) - 200 = 맵 높이 - 400
   */
  get FIXED_SPAWN_Y() {
    const colliderTop = this.scene.physics.world.bounds.height - 200;
    return colliderTop - 160; // 캐릭터 기본 offset
  }

  // ═══════════════════════════════════════════
  // 위치 결정 (X축만)
  // ═══════════════════════════════════════════

  resolveSpawnPositionX(isRespawn) {
    const { savedSpawnData, currentMapKey } = this.scene;
    const bounds = this.scene.physics.world.bounds;

    // 리스폰
    if (isRespawn) {
      return bounds.width / 2;
    }

    // 저장된 좌표
    if (savedSpawnData?.x !== undefined && !savedSpawnData.fromPortal) {
      return savedSpawnData.x;
    }

    // 포탈 진입
    if (savedSpawnData?.fromPortal) {
      const x = this.getPortalPositionX(savedSpawnData.portalId);
      if (x !== null) return x;
    }

    // 첫 포탈 또는 기본 스폰
    return this.getFirstPortalPositionX() || 100;
  }

  getPortalPositionX(portalId) {
    const portal = PortalManager.getPortal(portalId);
    if (portal?.sourceMap === this.scene.currentMapKey) {
      return portal.sourcePosition.x;
    }
    return null;
  }

  getFirstPortalPositionX() {
    const portals = PortalManager.getPortalsByMap(this.scene.currentMapKey);
    const first = portals[0];
    return first ? first.sourcePosition.x : null;
  }

  // ═══════════════════════════════════════════
  // 플레이어 생성
  // ═══════════════════════════════════════════

  instantiatePlayer(characterType, x, y) {
    const { mapConfig, mapModel } = this.scene;

    const player = CharacterFactory.create(this.scene, characterType, x, y, {
      scale: mapConfig.playerScale || 1,
    });

    player.sprite.setDepth(mapConfig.depths.player);
    this.scene.playerCollider = mapModel.addPlayer(player.sprite);

    return player;
  }

  // ═══════════════════════════════════════════
  // 바닥 스냅
  // ═══════════════════════════════════════════

  snapToGround(player) {
    const sprite = player?.sprite;
    const body = sprite?.body;
    if (!body) return;

    // Y축 기준 1: Collider의 윗면
    const colliderTop = this.getColliderTopY();

    // Y축 기준 2: 캐릭터 기준점 (캐릭터 offset 고려)
    const characterOffset = player.config?.bodyOffset?.y || 0;
    const characterBaseY = this.getCharacterBaseY(characterOffset);

    // Collider 윗면에 맞춰서 스냅
    const diff = colliderTop - body.bottom;
    const newY = sprite.y + diff;

    sprite.setY(newY);
    body.reset(sprite.x, newY);
    body.setVelocity(0, 0);
  }

  // ═══════════════════════════════════════════
  // 스폰 이펙트
  // ═══════════════════════════════════════════

  applySpawnEffects(player, duration = 1000) {
    // 무적
    player.setInvincible?.(duration);

    // 깜빡임
    this.playBlinkEffect(player.sprite, duration);

    // 스위치 쿨다운
    this.scene.isCharacterSwitchOnCooldown = true;
    this.scene.time.delayedCall(1800, () => {
      this.scene.isCharacterSwitchOnCooldown = false;
    });
  }

  playBlinkEffect(sprite, duration) {
    if (!sprite) return;

    if (this.scene.currentBlinkTween) {
      this.scene.currentBlinkTween.stop();
    }

    this.scene.currentBlinkTween = this.scene.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(duration, () => {
      if (this.scene.currentBlinkTween) {
        this.scene.currentBlinkTween.stop();
        this.scene.currentBlinkTween = null;
      }
      if (sprite) sprite.alpha = 1;
    });
  }
}
