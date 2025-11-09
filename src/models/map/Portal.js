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

    this.isPlayerNear = false;
    this.cooldown = false;

    // UI 텍스트 생성
    this.createPortalUI();

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

  createPortalUI() {
    // 포탈 위에 표시될 UI 텍스트
    this.portalText = this.scene.add
      .text(this.x, this.y - 80, '↑ Press UP to Enter', {
        fontSize: '16px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
  }

  update(player) {
    if (!player || !player.body) return;

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
    const isNear = distance < 100;

    // 플레이어가 가까워지면 UI 표시
    if (isNear && !this.isPlayerNear) {
      this.isPlayerNear = true;
      this.portalText.setVisible(true);
    } else if (!isNear && this.isPlayerNear) {
      this.isPlayerNear = false;
      this.portalText.setVisible(false);
    }

    // 플레이어가 가까이 있고 위 방향키를 눌렀을 때
    if (isNear && this.scene.inputHandler) {
      const input = this.scene.inputHandler.getInputState();

      if (input.isUpPressed && !this.cooldown) {
        this.onPlayerActivate();
      }
    }
  }

  onPlayerActivate() {
    console.log('🔵 onPlayerActivate called');
    console.log('  cooldown:', this.cooldown);
    console.log('  connectionInfo:', this.connectionInfo);
    console.log('  isPortalTransitioning:', this.scene.isPortalTransitioning);

    // 🎯 쿨다운 중이거나 Scene이 전환 중이면 무시
    if (this.cooldown || !this.connectionInfo) {
      console.log('❌ Blocked: cooldown or no connection');
      return;
    }

    // 🎯 Scene이 이미 전환 중이면 무시 (전역 플래그)
    if (this.scene.isPortalTransitioning) {
      console.log('❌ Blocked: already transitioning');
      return;
    }

    console.log(`✨ Player activated portal: ${this.portalId}`);
    console.log('  Target map:', this.connectionInfo.targetMap);
    console.log('  Target portal:', this.targetPortalId);

    // GameScene의 onPortalEnter 호출
    if (this.scene.onPortalEnter) {
      console.log('✅ Calling scene.onPortalEnter');
      this.cooldown = true;
      // 🎯 플래그는 GameScene에서 설정하도록 변경
      // this.scene.isPortalTransitioning = true;
      this.portalText.setVisible(false); // UI 숨기기

      // 포탈 이펙트 추가 (선택사항)
      this.scene.cameras.main.flash(300, 255, 255, 255);

      this.scene.onPortalEnter(
        this.connectionInfo.targetMap, // 다음 맵 키
        this.targetPortalId, // 다음 맵에서 스폰될 포탈 ID
      );
    } else {
      console.error('❌ scene.onPortalEnter is not defined!');
    }
  }

  destroy() {
    if (this.portalText) {
      this.portalText.destroy();
    }
    super.destroy();
  }
}
