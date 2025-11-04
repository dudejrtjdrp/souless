// ???�티??
export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
  }
}
