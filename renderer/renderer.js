import Phaser from 'phaser';
import GameScene from '../src/scenes/GameScene';
import SoulScene from '../src/scenes/SoulScene';
import UIScene from '../src/scenes/UIScene';
import EffectTestScene from '../src/scenes/TestScene';
import MainMenuScene from '../src/scenes/MainMenuScene';
import PauseMenuScene from '../src/scenes/PauseMenuScene ';

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
  scene: [MainMenuScene, GameScene, PauseMenuScene, EffectTestScene, SoulScene, UIScene],
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
