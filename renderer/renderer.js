import Phaser from 'phaser';
import GameScene from '../src/scenes/GameScene';
import UIScene from '../src/scenes/UIScene';
import EffectTestScene from '../src/scenes/TestScene';
import MainMenuScene from '../src/scenes/MainMenuScene';
import PauseMenuScene from '../src/scenes/PauseMenuScene ';
import BossTestScene from '../src/scenes/BossTestScene';
import EndingScene from '../src/scenes/EndingScene';
import IntroScene from '../src/scenes/IntroScene';
import UITestScene from '../src/scenes/UITestScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { debug: true },
  },
  scene: [
    MainMenuScene,
    IntroScene,
    GameScene,
    UIScene,
    PauseMenuScene,
    EndingScene,
    UITestScene,
    BossTestScene,
    EffectTestScene,
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  antialias: false,

  // 로더 설정
  loader: {
    baseURL: './',
    path: '',
    crossOrigin: undefined,
  },
};

const game = new Phaser.Game(config);

// 에러 핸들링
game.events.on('error', (error) => {
  console.error('Phaser Error:', error);
});

export default game;
