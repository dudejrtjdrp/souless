import Canine from '../entities/enemies/Canine.js';
import Slime from '../entities/enemies/Slime.js';
import Bat from '../entities/enemies/Bat.js';

export default class EnemyAssetLoader {
  static preload(scene) {
    Slime.preload(scene);
    Canine.preload(scene);
    Bat.preload(scene);
  }
}
