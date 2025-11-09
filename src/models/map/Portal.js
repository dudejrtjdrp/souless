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
    console.log(`✨ Player entered portal: ${this.portalId}`);

    if (this.cooldown || !this.connectionInfo) return;

    // GameScene의 onPortalEnter 호출
    if (this.scene.onPortalEnter) {
      this.cooldown = true;

      // 목적지 포탈 정보 전달
      this.scene.onPortalEnter({
        sourcePortalId: this.portalId,
        targetPortalId: this.targetPortalId,
        targetMap: this.connectionInfo.targetMap,
        targetPosition: this.connectionInfo.targetPosition,
      });

      // 쿨다운 리셋
      this.scene.time.delayedCall(1000, () => {
        this.cooldown = false;
      });
    }
  }

  onPlayerExit() {
    this.isPlayerInside = false;
    console.log(`👋 Player left portal: ${this.portalId}`);
  }
}
