import Phaser from 'phaser';

export default class Portal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, targetMap, targetSpawn) {
    super(scene, x, y);

    console.log('🔵 Portal 생성 시작:', { x, y, targetMap });

    this.scene = scene;
    this.targetMap = targetMap;
    this.targetSpawn = targetSpawn;
    this.isTeleporting = false;
    this.teleportDistanceX = 25; // X축 거리
    this.teleportDistanceY = 80; // Y축 거리

    const textureKey = scene.textures.exists('holy_vfx_02_1') ? 'holy_vfx_02_1' : '__DEFAULT';

    this.baseSprite = scene.add.sprite(0, 0, textureKey);
    this.baseSprite.setOrigin(0.5, 1);
    this.baseSprite.setScale(1.5);

    this.animSprite = scene.add.sprite(0, 0, textureKey);
    this.animSprite.setOrigin(0.5, 1);
    this.animSprite.setScale(1.5);

    // Container에 추가
    this.add([this.baseSprite, this.animSprite]);

    this.scene.add.existing(this);
    this.setDepth(30);
    this.setSize(60, 80);

    // ✅ 거리 기반 애니메이션을 위한 설정
    this.maxDistance = 150; // 포탈이 반응하기 시작하는 최대 거리 (200 → 150)
    this.minDistance = 60; // 완전히 열리는 거리 (80 → 60)
    this.teleportDistance = 40; // ✅ 텔레포트 가능 거리 (더 가까이 가야 함)
    this.currentFrame = 16; // 현재 프레임 (16 = 닫힘, 1 = 완전 열림)

    // Physics 설정
    this.scene.physics.world.enable(this);

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setImmovable(true);
      this.body.moves = false;
      this.body.setSize(60, 80);
      //   this.body.setOffset(-30, -80);
    }

    // ✅ 애니메이션 생성 및 자동 재생
    if (scene.textures.exists('holy_vfx_02_16')) {
      this.createAnimations();
      this.animSprite.play('portal_idle_loop');
    }

    console.log('🔵 Portal 생성 완료');
  }

  createAnimations() {
    // ✅ 천천히 반복되는 애니메이션 (2 → 16 → 2)
    if (!this.scene.anims.exists('portal_idle_loop')) {
      const frames = [];

      // (열리기)
      for (let i = 1; i <= 16; i++) {
        frames.push({
          key: 'holy_vfx_02_' + i,
          frame: null,
        });
      }

      for (let i = 16; i >= 1; i--) {
        frames.push({
          key: 'holy_vfx_02_' + i,
          frame: null,
        });
      }

      this.scene.anims.create({
        key: 'portal_idle_loop',
        frames: frames,
        frameRate: 12,
        repeat: -1, // 무한 반복
      });
    }
  }

  update(player) {
    // ✅ player가 sprite 객체인지 확인
    const distance = Math.abs(this.x - player.x);

    // ✅ 플레이어가 멈춰있는지 확인
    const isPlayerStopped = player.body && Math.abs(player.body.velocity.x) < 10;

    // ✅ 텔레포트 (포탈 위에서 위방향키 눌렀을 때)
    const isNearPortal = distance < this.minDistance;

    if (isNearPortal && !this.isTeleporting) {
      // ✅ 위방향키 입력 확인
      const cursors = this.scene.input.keyboard.createCursorKeys();

      if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        this.isTeleporting = true;

        console.log('🌀 Portal teleporting to:', this.targetMap);
        console.log(player.body);

        // ✅ 캐릭터 멈추기
        if (player.body) {
          player.body.setVelocity(0, 0);
        }

        // ✅ 짧은 딜레이 후 페이드 아웃 & 씬 전환
        this.scene.time.delayedCall(200, () => {
          this.scene.cameras.main.fadeOut(100, 0, 0, 0);

          this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.start('GameScene', {
              mapKey: this.targetMap,
              characterType: player.characterType || 'monk',
            });
          });
        });
      }
    }

    // 플레이어가 멀어지면 텔레포트 플래그 리셋
    if (distance >= this.teleportDistance + 20) {
      this.isTeleporting = false;
    }
  }
}
