import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
    this.dialogueIndex = 0;
    this.isDialoguePlaying = false;
    this.isInputLocked = false;
    this.planetLayers = [];
    this.dungeonLayers = [];
  }

  preload() {
    // ⭐ 1. 배경 레이어 로드
    this.load.image(`planet_bg`, `assets/intro/planet.png`);
    for (let i = 1; i <= 4; i++) {
      this.load.image(`dungeon_bg${i}`, `assets/intro/background/background${i}.png`);
    }

    // ⭐ 2. 캐릭터/신 스프라이트 시트 로드
    this.load.spritesheet('witch_idle_sheet', 'assets/intro/witch/idle.png', {
      frameWidth: 140,
      frameHeight: 150,
    });
    this.load.spritesheet('witch_death_sheet', 'assets/intro/witch/death.png', {
      frameWidth: 140,
      frameHeight: 140,
    });
    this.load.spritesheet('ancient_god_sheet', 'assets/intro/god/god.png', {
      frameWidth: 150,
      frameHeight: 150,
    });
    this.load.spritesheet('initial_soul_sheet', 'assets/effects/spirit.png', {
      frameWidth: 200,
      frameHeight: 200,
    });
  }

  createCharacterAnimations() {
    // 1. 마녀 IDLE
    if (!this.anims.exists('witch_idle_anim')) {
      this.anims.create({
        key: 'witch_idle_anim',
        frames: this.anims.generateFrameNumbers('witch_idle_sheet', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // 2. 마녀 DEATH
    if (!this.anims.exists('witch_death_anim')) {
      this.anims.create({
        key: 'witch_death_anim',
        frames: this.anims.generateFrameNumbers('witch_death_sheet', { start: 0, end: 17 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    // 3. 고대 신 IDLE
    if (!this.anims.exists('god_idle_anim')) {
      this.anims.create({
        key: 'god_idle_anim',
        frames: this.anims.generateFrameNumbers('ancient_god_sheet', { start: 0, end: 17 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // 4. Soul IDLE
    if (!this.anims.exists('soul_idle_anim')) {
      this.anims.create({
        key: 'soul_idle_anim',
        frames: this.anims.generateFrameNumbers('initial_soul_sheet', { start: 0, end: 21 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  create() {
    const { width, height } = this.cameras.main;

    // ⭐ 애니메이션을 create에서 생성
    this.createCharacterAnimations();

    // 1. 초기 상태 설정
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setAlpha(1);

    // 2. 배경 설정
    this.planetBg = this.add
      .image(width / 2, height / 2, 'planet_bg')
      .setDisplaySize(width, height)
      .setAlpha(0.5)
      .setDepth(0);
    this.planetLayers.push(this.planetBg);

    // 던전 배경 (4개 레이어)
    for (let i = 1; i <= 4; i++) {
      const layerImage = this.add
        .image(width / 2, height / 2, `dungeon_bg${i}`)
        .setDisplaySize(width, height)
        .setDepth(-10 + i)
        .setAlpha(0);
      this.dungeonLayers.push(layerImage);
    }

    // ⭐ 하단 검은색 collider (200px 높이)
    this.bottomCollider = this.add
      .rectangle(width / 2, height - 100, width, 200, 0x000000, 1)
      .setDepth(-5);

    // 3. 마녀의 잔해 및 편지
    this.witchRemains = this.add
      .sprite(width * 0.7, height - 120, 'witch_death_sheet', 0)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setAlpha(0)
      .setFlipX(true)
      .setDepth(10);

    // this.letterIcon = this.add
    //   .image(width * 0.4, height * 0.75, 'initial_soul_sheet', 0)
    //   .setTint(0xffaa00)
    //   .setScale(0.5)
    //   .setAlpha(0);

    // 4. Soul의 탄생 형태
    this.soulBlob = this.add
      .sprite(width / 2, height / 2, 'initial_soul_sheet', 0)
      .setOrigin(0.5, 1)
      .setScale(0.1)
      .setTint(0x00ffff)
      .setAlpha(0);

    // 5. 대화 시스템 설정
    this.setupDialogueSystem(width, height);
    this.setupInput(width, height);

    // 6. 씬 시작
    this.time.delayedCall(500, this.startDialogue, [], this);
  }

  // =======================================================
  // 씬 전용 연출 함수
  // =======================================================
  performIntroAction(action) {
    const { width, height } = this.cameras.main;

    if (action === 'change_to_dungeon') {
      // 입력 잠금
      this.isInputLocked = true;

      // ✅ 수정된 fadeOut 사용법
      this.cameras.main.fadeOut(2000, 0, 0, 0);

      // fadeOut 완료 이벤트 리스너 등록
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // 배경 및 캐릭터 상태 전환
        this.planetLayers.forEach((layer) => layer.setAlpha(0));
        this.dungeonLayers.forEach((layer) => layer.setAlpha(0.7));

        // 마녀 잔해 표시 및 애니메이션 재생
        this.witchRemains.setAlpha(0.7);
        this.witchRemains.play('witch_death_anim');

        // this.letterIcon.setAlpha(0.5);

        // 다시 밝게 페이드 인
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // fadeIn 완료 후 입력 잠금 해제
        this.cameras.main.once('camerafadeincomplete', () => {
          this.isInputLocked = false;
        });
      });
    } else if (action === 'soul_birth') {
      this.soulBlob.setPosition(width * 0.7, height - 180);
      this.soulBlob.setScale(0.01);
      this.soulBlob.setAlpha(0.3);
      this.soulBlob.setDepth(5);
      this.soulBlob.play('soul_idle_anim');

      // 위로 천천히 떠오르며 커지고 밝아지는 애니메이션
      this.tweens.add({
        targets: this.soulBlob,
        y: height - 270,
        scale: 0.2,
        alpha: 0.8,
        duration: 3000,
        ease: 'Sine.easeOut',
      });

      // 빛나는 효과 추가
      this.tweens.add({
        targets: this.soulBlob,
        alpha: 1,
        duration: 500,
        yoyo: true,
        repeat: 5,
        delay: 500,
      });
    } else if (action === 'soul_grow') {
      // Soul Blob 점점 커지는 연출
      if (!this.soulBlob.anims.isPlaying) {
        this.soulBlob.play('soul_idle_anim');
      }

      //   this.tweens.add({
      //     targets: this.soulBlob,
      //     x: width * 0.7,
      //     y: height - 120,
      //     scale: 0.4,
      //     alpha: 1,
      //     duration: 1500,
      //     ease: 'Sine.easeInOut',
      //   });
    } else if (action === 'show_letter') {
      // 편지 아이콘 강조
      //   this.tweens.add({
      //     targets: this.letterIcon,
      //     scale: 1.2,
      //     duration: 300,
      //     yoyo: true,
      //     repeat: 2,
      //   });
    } else if (action === 'god_appear') {
      // 고대 신 등장
      if (!this.ancientGod) {
        this.ancientGod = this.add
          .sprite(width * 0.3, height - 300, 'ancient_god_sheet', 0)
          .setAlpha(0)
          .setScale(3)
          .setDepth(500);

        this.ancientGod.play('god_idle_anim');
      }

      this.tweens.add({
        targets: this.ancientGod,
        alpha: 1,
        duration: 1000,
      });
    } else if (action === 'dungeon_collapse') {
      // 던전 붕괴 연출
      this.cameras.main.shake(500, 0.02);

      this.cameras.main.fadeOut(1000, 0, 0, 0);

      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          mapKey: 'other_cave',
          characterType: 'soul',
          skipSaveCheck: true,
          isTutorial: true,
          isNewGame: true,
        });
      });
    } else if (action === 'witch_death') {
      // 입력 잠금
      this.isInputLocked = true;

      // ✅ 수정된 fadeOut 사용법
      this.cameras.main.fadeOut(2000, 0, 0, 0);

      // fadeOut 완료 이벤트 리스너 등록
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // 배경 및 캐릭터 상태 전환
        this.dungeonLayers.forEach((layer) => layer.setAlpha(0.7));

        // 마녀 잔해 표시 및 애니메이션 재생
        this.witchRemains.setAlpha(0);
        this.tweens.add({
          targets: this.soulBlob,
          scale: 0.4,
          alpha: 0.7,
          duration: 10,
          ease: 'Sine.easeOut',
        });

        // 다시 밝게 페이드 인
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // fadeIn 완료 후 입력 잠금 해제
        this.cameras.main.once('camerafadeincomplete', () => {
          this.isInputLocked = false;
        });
      });
    }
  }

  // =======================================================
  // 대화 시스템
  // =======================================================

  setupDialogueSystem(width, height) {
    const boxY = height * 0.9;

    this.dialogueText = this.add
      .text(width / 2, boxY, '', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 100 },
      })
      .setOrigin(0.5)
      .setDepth(901)
      .setVisible(false);

    this.speakerName = this.add
      .text(width / 2, boxY - 50, '', {
        fontSize: '28px',
        fontFamily: 'Arial Black',
        color: '#ffdd00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(901)
      .setVisible(false);

    this.dialogues = [
      { speaker: '내레이션', text: '행성 스리란디카(Srilandica)는 멸망의 위기에 처해 있었다.' },
      { speaker: '내레이션', text: '세상에 이상한 존재들이 나타나기 시작했고, 희망은 사라져갔다.' },

      { speaker: '', text: ' ', action: 'change_to_dungeon' },

      {
        speaker: '내레이션',
        text: '세 대마법사 중 한 명이었던 그녀, 마녀는 이 모든 파국 속에서 자신의 자녀를 잃고 미쳐버렸다.',
      },
      {
        speaker: '내레이션',
        text: '마녀는 자신의 모든 마력을 동원해 고대 신의 던전으로 향했다.',
      },
      {
        speaker: '내레이션',
        text: '목적은 단 하나, 자녀를 되살리는 것.',
      },
      {
        speaker: '고대 신',
        text: '방법은 있으나, 너는 아기를 볼 수도, 키울 수도 없을 것이다',
        action: 'god_appear',
      },
      {
        speaker: '고대 신',
        text: '아기는 형태 없는 무언가로 태어나, 결국 이 모든 파국을 해결하기 위해 희생될 운명이다.',
        action: 'god_appear',
      },
      {
        speaker: '마녀 (회상)',
        text: '괜찮습니다. 저는... 그저 희망만이 필요합니다.',
      },
      {
        speaker: '마녀 (회상)',
        text: '어떤 희생이라도 감수하겠습니다.',
      },
      {
        speaker: '고대 신',
        text: '그 방법을 위해선 각 차원과 종족의 피, 그리고 의지가 담긴 영혼 등 억겁의 재료가 필요할 것이다.',
      },
      {
        speaker: '고대 신',
        text: '준비할 수 있겠느냐?',
      },
      {
        speaker: '내레이션',
        text: '마녀는 수많은 세계를 넘나들며 재료를 모았다. ',
      },
      {
        speaker: '내레이션',
        text: '천사, 악마, 엘프, 인간... 그리고 아이의 피까지.',
      },
      {
        speaker: '내레이션',
        text: '이 세상의 유일한 희망을 위해서.',
      },
      {
        speaker: '내레이션',
        text: '마지막으로 용액을 마신 마녀는 쓰러졌고, 그녀의 몸 위로 생명 에너지가 집합된 작은 점이 떠올랐다.',
        action: 'soul_birth',
      },

      {
        speaker: '내레이션',
        text: '점은 억겁의 시간 동안 주변의 생명력을 흡수하며 점점 커졌다.',
        action: 'soul_grow',
      },
      {
        speaker: '내레이션',
        text: '그렇게 탄생한 존재. 에너지 집합체, Soul이었다.',
      },
      {
        speaker: '내레이션',
        text: '자아는 있으나 형태는 없고, 힘은 있으나 사용할 줄 모르는 순수한 존재.',
      },

      {
        speaker: '',
        text: '',
        action: 'witch_death',
      },
      {
        speaker: '내레이션',
        text: 'Soul은 쓰러진 마녀 옆에서 오래된 편지를 발견했다.',
        action: 'show_letter',
      },
      {
        speaker: '마녀가 남긴 편지',
        text: '나의 아가... 엄마는 네가 어떤 모습일지 보지도, 안아주지도 못하겠구나.',
      },
      {
        speaker: '마녀가 남긴 편지',
        text: '하지만 너는 이 세상의 마지막 희망이다. 강하게 자라렴.',
      },
      { speaker: 'Soul', text: '...엄마? 내가... 희망?' },

      {
        speaker: '고대 신',
        text: '어서 나가야 한다, Soul.',
      },
      {
        speaker: '고대 신',
        text: '네가 주변의 생명력을 빨아들이며 탄생했기에, 이 공간은 내가 마지막 힘으로 유지하고 있었다.',
      },
      {
        speaker: '고대 신',
        text: '나가는 곳은 저기다.',
      },
      {
        speaker: '고대 신',
        text: '네가 이곳에 더 머물면 나의 마지막 힘마저 고갈될 것이다. 서둘러라!',
      },
      {
        speaker: 'Soul',
        text: '지금 무슨 상황인거죠? 제가 나가서 뭘 해야하나요?',
      },
      {
        speaker: '고대 신',
        text: '기억하거라. 모든 영혼은 결국 한 곳에 모일 것이다. 그것이 너의 운명이다.',
      },
      {
        speaker: '',
        text: '고대신은 Soul을 버려져있는 육체에 넣은 뒤 던전 밖으로 내보냈다.',
        action: '',
      },
      {
        speaker: '',
        text: 'Soul이 던전을 빠져나가자, 고대 신의 힘이 다한 던전은 요동치며 무너지기 시작했다.',
        action: '',
      },
      {
        speaker: '',
        text: '',
        action: 'dungeon_collapse',
      },
      {
        speaker: '',
        text: 'Soul은 던전을 빠져나왔다. 이제 그의 사명, 세계를 구원할 여정이 시작된다.',
      },
      { speaker: '', text: 'START GAME' },
    ];
  }

  startDialogue() {
    this.speakerName.setVisible(true);
    this.dialogueText.setVisible(true);
    this.isDialoguePlaying = true;
    this.showDialogue(0);
  }

  showDialogue(index) {
    if (index >= this.dialogues.length) {
      this.endDialogue();
      return;
    }

    const dialogue = this.dialogues[index];
    this.speakerName.setText(dialogue.speaker);
    this.dialogueText.setText('');

    if (dialogue.action) {
      this.performIntroAction(dialogue.action);
    }

    if (this.typewriterTimer) this.typewriterTimer.remove();
    let charIndex = 0;

    this.typewriterTimer = this.time.addEvent({
      delay: 40,
      callback: () => {
        if (charIndex < dialogue.text.length) {
          this.dialogueText.setText(this.dialogueText.text + dialogue.text[charIndex]);
          charIndex++;
        } else {
          this.typewriterTimer.remove();
        }
      },
      loop: true,
    });
  }

  nextDialogue() {
    // 입력이 잠겨있으면 무시
    if (!this.isDialoguePlaying || this.isInputLocked) return;

    const currentLine = this.dialogues[this.dialogueIndex];

    if (this.dialogueText.text.length < currentLine.text.length) {
      if (this.typewriterTimer) this.typewriterTimer.remove();
      this.dialogueText.setText(currentLine.text);
      return;
    }

    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogues.length) {
      this.showDialogue(this.dialogueIndex);
    } else {
      this.endDialogue();
    }
  }

  endDialogue() {
    this.isDialoguePlaying = false;
  }

  setupInput(width, height) {
    this.add
      .text(width - 20, height - 20, 'SPACE to Next / ESC to Skip', {
        fontSize: '16px',
        color: '#888888',
      })
      .setOrigin(1, 1)
      .setDepth(1000);
    this.input.keyboard.on('keydown-SPACE', () => this.nextDialogue());
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('GameScene', {
        mapKey: 'other_cave',
        characterType: 'soul',
        skipSaveCheck: true,
        isTutorial: true,
        isNewGame: true,
      });
    });
  }
}
