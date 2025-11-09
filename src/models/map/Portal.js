// src/models/map/Portal.js

import Phaser from 'phaser';
import { PortalManager } from '../../config/portalData.js';

export default class Portal extends Phaser.GameObjects.Sprite {
  constructor(scene, portalData) {
    const { x, y, id, targetPortalId } = portalData;

    super(scene, x, y, 'holy_vfx_02_1');

    this.scene = scene;
    this.portalId = id;
    this.targetPortalId = targetPortalId;

    // 포탈 연결 정보 가져오기
    this.connectionInfo = PortalManager.getPortalConnection(id);

    if (!this.connectionInfo) {
      console.error(`❌ Portal connection not found for ID: ${id}`);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.immovable = true;

    this.setScale(2);
    this.setDepth(50);

    this.createAnimation();
    this.play('portal_idle');

    this.isPlayerInside = false;
    this.cooldown = false;

    console.log(`🌀 Portal created: ${id} → ${targetPortalId}`);
  }

  createAnimation() {
    if (!this.scene.anims.exists('portal_idle')) {
      this.scene.anims.create({
        key: 'portal_idle',
        frames: Array.from({ length: 16 }, (_, i) => ({
          key: `holy_vfx_02_${i + 1}`,
        })),
        frameRate: 12,
        repeat: -1,
      });
    }
  }

  update(player) {
    if (!player || !player.body) return;

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

    const isNear = distance < 100;

    if (isNear && !this.isPlayerInside) {
      this.onPlayerEnter(player);
    } else if (!isNear && this.isPlayerInside) {
      this.onPlayerExit();
    }
  }

  onPlayerEnter(player) {
    this.isPlayerInside = true;

    // 🎯 쿨다운 중이거나 Scene이 전환 중이면 무시
    if (this.cooldown || !this.connectionInfo) {
      return;
    }

    // 🎯 Scene이 이미 전환 중이면 무시 (전역 플래그)
    if (this.scene.isPortalTransitioning) {
      return;
    }

    console.log(`✨ Player entered portal: ${this.portalId}`);

    // GameScene의 onPortalEnter 호출
    if (this.scene.onPortalEnter) {
      this.cooldown = true;
      this.scene.isPortalTransitioning = true; // 🎯 전역 플래그 설정

      // 🎯 수정: targetPortalId를 명확히 전달
      this.scene.onPortalEnter(
        this.connectionInfo.targetMap, // 다음 맵 키
        this.targetPortalId, // 다음 맵에서 스폰될 포탈 ID
      );

      // 쿨다운 리셋 (Scene이 바뀌면 의미 없지만 안전장치)
      this.scene.time.delayedCall(2000, () => {
        this.cooldown = false;
        if (this.scene.isPortalTransitioning) {
          this.scene.isPortalTransitioning = false;
        }
      });
    }
  }

  onPlayerExit() {
    this.isPlayerInside = false;
    console.log(`👋 Player left portal: ${this.portalId}`);
  }
}
