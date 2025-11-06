import Phaser from 'phaser';
import SoulScene from './scenes/SoulScene';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },
  scene: [GameScene, SoulScene], // 나중에 SoulScene도 추가 가능
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// 윈도우 리사이즈 대응
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export default game;
