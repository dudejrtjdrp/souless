import Phaser from 'phaser';
import CharacterAssetLoader from '../utils/CharacterAssetLoader.js';
// ⚠️ CharacterData 파일 경로를 확인하고 가져옵니다.
import { CharacterData } from '../config/characterData.js';

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
    this.dialogueIndex = 0;
    this.isDialoguePlaying = false;
  }

  preload() {
    // CharacterAssetLoader는 스프라이트 시트 로드만 담당하도록 유지
    CharacterAssetLoader.preload(this); // 배경 로드

    this.load.image('snow_bg1', 'assets/map/snow/background1.png');
    this.load.image('snow_bg2', 'assets/map/snow/background2.png');
    this.load.image('snow_bg3', 'assets/map/snow/background3.png');
  }

  create() {
    // 1. 애니메이션 생성

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }

    this.createCharacterAnimations();

    const { width, height } = this.cameras.main;
    const groundHeight = 200;
    const viewHeight = height - groundHeight;
    const viewCenterY = viewHeight / 2;
    const groundY = height - groundHeight / 2;
    const charY = height - groundHeight; // 2. 배경 및 바닥 설정

    ['snow_bg1', 'snow_bg2', 'snow_bg3'].forEach((bgKey, index) => {
      this.add
        .image(width / 2, viewCenterY, bgKey)
        .setDisplaySize(width, viewHeight)
        .setDepth(-100 + index * 10);
    });

    const groundRect = this.add
      .rectangle(width / 2, groundY, width, groundHeight, 0x000000, 1)
      .setDepth(5);

    this.groundGroup = this.physics.add.staticGroup();
    this.groundBody = this.groundGroup.add(groundRect); // 3. 엔딩 텍스트

    this.add
      .text(width / 2, 80, 'GAME CLEAR', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#005577',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(1000); // 4. 캐릭터 배치 (Soul 왼쪽, 동료 오른쪽)

    const supportCharacters = ['monk', 'bladekeeper', 'fireknight', 'mauler', 'princess'];
    this.characters = [];

    const totalChars = supportCharacters.length + 1;
    const soulX = width * 0.2; // A. Soul 배치 (왼쪽)

    const soulChar = this.add
      .sprite(soulX, charY, 'soul')
      .setOrigin(0.5, 1)
      .setScale(3.5)
      .setAlpha(1)
      .setFlipX(false)
      .setDepth(100);
    const soulAnimKey = 'soul_idle';
    if (this.anims.exists(soulAnimKey)) soulChar.play(soulAnimKey);
    this.characters.push({ sprite: soulChar, type: 'soul' }); // B. 동료 배치 (오른쪽)

    const startX = width * 0.5;
    const groupWidth = width * 0.45;
    const innerSpacing = groupWidth / (supportCharacters.length - 1);

    supportCharacters.forEach((charType, index) => {
      const charKey = charType;
      const animKey = `${charType}_idle`;
      const x = startX + innerSpacing * index;

      const char = this.add
        .sprite(x, charY, charKey)
        .setOrigin(0.5, 1)
        .setScale(3)
        .setAlpha(0.7)
        .setFlipX(true)
        .setDepth(100);

      if (this.anims.exists(animKey)) {
        char.play(animKey);
      } else {
        console.warn(
          `WARN: Animation key "${animKey}" not found. Ensure CharacterData is complete.`,
        );
      }

      this.characters.push({ sprite: char, type: charType });
    }); // 5. 대화 시스템 설정 및 시작

    this.setupDialogueSystem(width, height, groundHeight); // ⭐️ 핵심: 1초 지연 후 startDialogue 호출

    this.time.delayedCall(1000, this.startDialogue, [], this);

    this.setupInput(width, height);
  }

  createCharacterAnimations() {
    for (const charKey in CharacterData) {
      const data = CharacterData[charKey];

      data.animations.forEach((animData) => {
        const animKey = `${charKey}_${animData.key}`;
        if (this.anims.exists(animKey)) return;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(data.sprite.key, animData.frames),
          frameRate: animData.frameRate,
          repeat: animData.repeat,
        });
      });
    }
  }

  // =======================================================
  // ✅ 복구된 필수 대화 시스템 함수
  // =======================================================

  setupDialogueSystem(width, height, groundHeight) {
    // 대화창은 검은색 바닥 영역 안에 표시
    const boxY = height - groundHeight / 2; // 대화 텍스트

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
      .setVisible(false); // 화자 이름 (바닥 상단 경계선 근처에 표시)

    this.speakerName = this.add
      .text(width / 2, height - groundHeight - 30, '', {
        fontSize: '28px',
        fontFamily: 'Arial Black',
        color: '#ffdd00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(901)
      .setVisible(false); // 대화 데이터

    this.dialogues = [
      {
        speaker: '',
        assetKey: '',
        text: '사악한 마법사 Eveless의 본거지, 눈 덮인 성채. 마법사의 존재는 완전히 소멸되었고, 영웅들의 영혼은 육신을 떠나기 직전이다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '마침내 그 긴 그림자가 걷혔습니다. Eveless의 흑마법은 더 이상 이 땅에 존재하지 않아요.',
      },
      {
        speaker: 'Monk',
        assetKey: 'monk',
        text: '그 마법사는 저희 영웅들의 가장 강력한 힘, 바로 영혼을 탈취하여 본인의 에너지원으로 사용했었죠.',
      },
      {
        speaker: 'Monk',
        assetKey: 'monk',
        text: '저희의 육신은 의식 없는 도구로 전락하여, Eveless의 의지대로 움직였습니다. 그때의 절망이란...',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '저는 단지 여러분의 육신에 깃들어 잠시나마 의지를 부여하고, Eveless에게 대항할 수 있도록 도왔을 뿐입니다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '진정한 힘은 육신 안에 갇혀있던 여러분의 영혼이었습니다.',
      },
      {
        speaker: 'Bladekeeper',
        assetKey: 'bladekeeper',
        text: '겸손하십니다, Soul이여. 저희의 영혼은 속박되어 아무것도 할 수 없었습니다.',
      },
      {
        speaker: 'Bladekeeper',
        assetKey: 'bladekeeper',
        text: '당신의 용기 있는 행동이 그 속박을 부순 겁니다.',
      },
      {
        speaker: 'Bladekeeper',
        assetKey: 'bladekeeper',
        text: '당신이 이 육신에 깃들어 싸울 때, 저는 제 검이 이전보다 더 날카로운 의지로 움직이는 것을 느꼈습니다. 감사드립니다.',
      },
      {
        speaker: 'Fire Knight',
        assetKey: 'fireknight',
        text: '맞네! Eveless가 우리 몸을 조종할 때는 불꽃이 차갑게 식어버렸지!',
      },
      {
        speaker: 'Fire Knight',
        assetKey: 'fireknight',
        text: '하지만 자네가 들어오자 심장이 다시 뜨겁게 뛰었네!',
      },
      {
        speaker: 'Mauler',
        assetKey: 'mauler',
        text: '크아앙! 이제 자유다! ',
      },
      {
        speaker: 'Mauler',
        assetKey: 'mauler',
        text: 'Soul, 네 덕분에 이 주먹이 그 사악한 마법사 면상에 제대로 박힐 수 있었어!',
      },
      {
        speaker: 'Mauler',
        assetKey: 'mauler',
        text: '평생 은혜 잊지 않을게!',
      },
      {
        speaker: 'Monk',
        assetKey: 'monk',
        text: '이제 저희의 영혼은 마땅히 돌아갈 곳으로 떠나야 합니다.',
      },
      {
        speaker: 'Monk',
        assetKey: 'monk',
        text: '하지만 이 육신은... 저희의 빈자리가 또 다른 악을 불러올 수 있습니다.',
      },
      {
        speaker: 'Princess',
        assetKey: 'princess',
        text: 'Soul님, 저희는 당신의 깨끗하고 강한 영혼을 믿습니다.',
      },
      {
        speaker: 'Princess',
        assetKey: 'princess',
        text: '이 육신들을 당신께 영원히 맡기겠습니다.',
      },
      {
        speaker: 'Princess',
        assetKey: 'princess',
        text: '부디 이 힘들을 사용하여, Eveless 같은 존재가 다시는 나타나지 못하도록 이 세상을 지켜주세요.',
      },
      {
        speaker: 'Princess',
        assetKey: 'princess',
        text: '이것이 저희 영웅들의 마지막 부탁입니다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '(고개를 숙이며) ...감사합니다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: ' 이 숭고한 믿음을 결코 헛되이 하지 않겠습니다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: ' 당신들의 용기와 힘은 이제 저의 사명이 되었습니다.',
      },
      {
        speaker: '',
        assetKey: '',
        text: '모든 영웅들의 몸에서 눈부시게 밝은 빛이 솟아올랐다.',
      },
      {
        speaker: '',
        assetKey: '',
        text: '그들의 영혼은 마침내 속박에서 완전히 벗어나 하늘로 승천했다.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '안녕히 가세요, 위대한 영웅들이여.',
      },
      {
        speaker: 'Soul',
        assetKey: 'soul',
        text: '당신들의 헌신을 이 세상이 영원히 기억할 것입니다.',
      },
      {
        speaker: '',
        assetKey: '',
        text: 'Soul은 이제 영웅들의 육신과 그들의 의지, 그리고 홀로 남은 사명을 짊어지고 새로운 여정을 시작했다.',
      },
      { speaker: '', assetKey: '', text: 'GAME CLEAR' },
      { speaker: '', assetKey: '', text: 'THE END' },
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
    this.highlightSpeaker(dialogue.assetKey);

    this.speakerName.setText(dialogue.speaker);
    this.dialogueText.setText(''); // 타이핑 효과

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

  // =======================================================
  // 기존에 있던 다른 함수들 (유지)
  // =======================================================

  setupInput(width, height) {
    this.add
      .text(width - 20, height - 20, 'SPACE to Next', { fontSize: '16px', color: '#888888' })
      .setOrigin(1, 1)
      .setDepth(1000);
    this.input.keyboard.on('keydown-SPACE', () => this.nextDialogue());
    this.input.keyboard.on('keydown-ESC', () => this.skipToMainMenu());
  }

  highlightSpeaker(assetKey) {
    this.characters.forEach((char) => {
      char.sprite.setAlpha(0.7).setScale(3);
    });

    if (!assetKey) return;

    const speaker = this.characters.find(
      (char) => char.type.toLowerCase() === assetKey.toLowerCase(),
    );

    if (speaker) {
      speaker.sprite.setAlpha(0.7).setScale(3.5);
    }
  }

  nextDialogue() {
    if (!this.isDialoguePlaying) return;
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
    this.cameras.main.fadeOut(2000, 0, 0, 0);
    this.time.delayedCall(2000, () => this.scene.start('MainMenuScene'));
  }

  skipToMainMenu() {
    this.scene.start('MainMenuScene');
  }
}
