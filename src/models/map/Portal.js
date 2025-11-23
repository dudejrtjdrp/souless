import Phaser from 'phaser';
import { PortalManager } from '../../controllers/PortalManager';
import { PortalConditionManager } from '../../systems/PortalConditionManager';
import { KillTracker } from '../../systems/KillTracker';

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
      console.error(`Portal connection not found for ID: ${id}`);
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

    // 포탈 조건 리스너 등록
    this.setupConditionListener();

    // 초기 상태 업데이트
    this.updateVisualState();

    // 초기 잠금 UI 업데이트 (async)
    this.updateLockUI();
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

    // 잠금 상태 텍스트 (진행도 표시용)
    this.lockText = this.scene.add
      .text(this.x, this.y - 110, 'locked', {
        fontSize: '14px',
        fill: '#ff6666',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
  }

  // 포탈 조건 리스너 설정
  setupConditionListener() {
    // 포탈 열림 이벤트 리스너
    this.conditionListener = (event, data) => {
      if (event === 'portal_unlocked' && data === this.portalId) {
        this.onPortalUnlocked();
      }
    };
    PortalConditionManager.addListener(this.conditionListener);

    // KillTracker 변경사항 실시간 반영을 위한 리스너 추가
    this.killListener = async () => {
      // 1. 현재 플레이어가 근처에 없다면 UI 갱신 불필요
      if (!this.isPlayerNear) return;

      // 2. 상태 확인 (킬 트래커 업데이트 직후 상태를 다시 가져옴)
      const isNowUnlocked = this.isUnlocked();

      if (isNowUnlocked) {
        // [조건 달성 시]
        // 텍스트 가시성 즉시 교체
        this.portalText.setVisible(true);
        this.lockText.setVisible(false);

        // 시각 상태 업데이트 (이미지 틴트/알파 등)
        this.updateVisualState();
      } else {
        // [아직 잠겨있음]
        // await 추가
        await this.updateLockUI();

        // 만약 포탈 텍스트가 켜져있다면 끔
        this.portalText.setVisible(false);
      }
    };

    KillTracker.addListener(this.killListener);
  }

  // 포탈 열림 여부 확인 주석 삭제
  isUnlocked() {
    return true;
    // return PortalConditionManager.isPortalUnlocked(this.portalId);
  }

  // 시각적 상태 업데이트
  updateVisualState() {
    const unlocked = this.isUnlocked();

    if (unlocked) {
      this.setTint(0xffffff);
      this.setAlpha(1);
    } else {
      this.setTint(0x666666);
      this.setAlpha(0.6);
    }
  }

  // 포탈이 열렸을 때 호출
  onPortalUnlocked() {
    this.updateVisualState();

    // 열림 이펙트
    this.scene.cameras.main.flash(200, 100, 255, 100);

    // 열림 알림
    const unlockText = this.scene.add
      .text(this.x, this.y - 120, '🌀 Portal Unlocked!', {
        fontSize: '20px',
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.scene.tweens.add({
      targets: unlockText,
      alpha: 0,
      y: this.y - 160,
      duration: 1500,
      onComplete: () => unlockText.destroy(),
    });
  }

  // 잠금 상태 UI 업데이트 (async로 변경)
  async updateLockUI() {
    const progress = await PortalConditionManager.getPortalProgress(this.portalId);

    if (!progress || progress.isComplete) {
      this.lockText.setVisible(false);
      return;
    }

    let lockTextContent = '🔒 Locked\n';

    // 킬 카운트 조건
    if (progress.type === 'kill_count') {
      const lines = progress.progress.map((p) => {
        const icon = p.completed ? '✓' : '✗';
        return `${icon} ${p.enemyType}: ${p.current}/${p.required}`;
      });
      lockTextContent += lines.join('\n');
    }
    // 보스 처치 수 조건
    else if (progress.type === 'boss_count') {
      lockTextContent += `👑 Bosses: ${progress.current}/${progress.required}`;
    }
    // 특정 보스 처치 조건
    else if (progress.type === 'boss_defeat') {
      lockTextContent += '👑 Defeat the Boss';
    }
    // 총 레벨 조건
    else if (progress.type === 'total_level') {
      const icon = progress.isComplete ? '✓' : '✗';
      lockTextContent += `${icon} Total Level: ${progress.current}/${progress.required}`;
    }
    // 각 캐릭터 레벨 조건
    else if (progress.type === 'character_levels') {
      const lines = progress.progress.map((p) => {
        const icon = p.completed ? '✓' : '✗';
        return `${icon} ${p.characterType}: Lv.${p.level}/${p.required}`;
      });
      lockTextContent += lines.join('\n');
    }

    this.lockText.setText(lockTextContent);
    this.lockText.setVisible(true);
  }

  async update(player) {
    if (!player || !player.body) return;

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
    const isNear = distance < 100;
    const unlocked = this.isUnlocked();

    // 플레이어가 가까워지면 UI 표시
    if (isNear && !this.isPlayerNear) {
      this.isPlayerNear = true;

      if (unlocked) {
        this.portalText.setVisible(true);
        this.lockText.setVisible(false);
      } else {
        this.portalText.setVisible(false);
        await this.updateLockUI();
      }
    } else if (!isNear && this.isPlayerNear) {
      this.isPlayerNear = false;
      this.portalText.setVisible(false);
      this.lockText.setVisible(false);
    }

    // 입력 체크 개선 - 더 자세한 디버깅
    if (isNear && this.scene.inputHandler) {
      const input = this.scene.inputHandler.getInputState();

      // 매 프레임 상태 확인 (일시적으로)
      if (isNear && !this.cooldown) {
        const cursors = this.scene.input.keyboard.createCursorKeys();

        // 직접 키보드 상태 체크
        if (cursors.up.isDown) {
          if (unlocked) {
            this.onPlayerActivate();
          } else {
            this.showLockedFeedback();
            this.cooldown = true;
            this.scene.time.delayedCall(1000, () => {
              this.cooldown = false;
            });
          }
        }
      }
    }
  }

  // 잠긴 포탈 활성화 시도 시 피드백
  showLockedFeedback() {
    // 화면 흔들림
    this.scene.cameras.main.shake(100, 0.005);

    // 잠금 텍스트 강조
    this.scene.tweens.add({
      targets: this.lockText,
      scale: 1.1,
      duration: 100,
      yoyo: true,
    });
  }

  onPlayerActivate() {
    if (this.cooldown || !this.connectionInfo) {
      return;
    }

    if (this.scene.isPortalTransitioning) {
      return;
    }

    if (this.scene.onPortalEnter) {
      this.cooldown = true;
      this.portalText.setVisible(false);

      this.scene.cameras.main.flash(300, 255, 255, 255);

      this.scene.onPortalEnter(this.connectionInfo.targetMap, this.targetPortalId);
    } else {
      console.error('scene.onPortalEnter is not defined!');
    }
  }

  destroy() {
    // 리스너 정리
    if (this.conditionListener) {
      PortalConditionManager.removeListener(this.conditionListener);
    }
    if (this.killListener) {
      KillTracker.removeListener(this.killListener);
    }
    if (this.portalText) {
      this.portalText.destroy();
    }
    if (this.lockText) {
      this.lockText.destroy();
    }
    super.destroy();
  }
}
