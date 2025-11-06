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
    arcade: { debug: false },
  },
  scene: [GameScene, SoulScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  antialias: false,
};

console.log('Phaser config:', config);

const game = new Phaser.Game(config);

console.log('Phaser game created:', game);

// Electron API 사용 예제
if (window.electronAPI) {
  console.log('Electron API available');
}

export default game;
