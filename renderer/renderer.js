(() => {
  const originalError = console.error;
  const originalWarn = console.warn;

  function shouldIgnore(message) {
    // 🔍 Phaser가 파일 처리 실패 메시지를 찍을 때 공통적으로 포함되는 키워드
    return message.includes('Failed to process file') && message.includes('image');
  }

  console.error = function (...args) {
    const message = args.join(' ');
    if (shouldIgnore(message)) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args.join(' ');
    if (shouldIgnore(message)) {
      return;
    }
    originalWarn.apply(console, args);
  };
})();

import Phaser from 'phaser';
import GameScene from '../src/scenes/GameScene';
import SoulScene from '../src/scenes/SoulScene';
import UIScene from '../src/scenes/UIScene';
import EffectTestScene from '../src/scenes/TestScene';
import MainMenuScene from '../src/scenes/MainMenuScene';
import PauseMenuScene from '../src/scenes/PauseMenuScene ';
import MapTestScene from '../src/scenes/MapTestScene';
import BossTestScene from '../src/scenes/BossTestScene';

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
    GameScene,
    MainMenuScene,
    BossTestScene,
    PauseMenuScene,
    EffectTestScene,
    SoulScene,
    UIScene,
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  antialias: false,
};

const game = new Phaser.Game(config);

// Electron API 사용 예제
if (window.electronAPI) {
}

export default game;
