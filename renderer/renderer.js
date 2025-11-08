import Phaser from 'phaser';
import GameScene from '../src/scenes/GameScene';
import SoulScene from '../src/scenes/SoulScene';

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
  scene: [GameScene, SoulScene],
  scale: {
    mode: Phaser.Scale.FIT,
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
