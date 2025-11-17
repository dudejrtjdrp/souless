import Canine from '../entities/enemies/useable/Canine.js';
import Slime from '../entities/enemies/useable/Slime.js';
import Bat from '../entities/enemies/useable/Bat.js';
import PurpleMonkey from '../entities/enemies/useable/PurpleMonkey.js';

export default class EnemyAssetLoader {
  static preload(scene) {
    Slime.preload(scene);
    Canine.preload(scene);
    Bat.preload(scene);
    PurpleMonkey.preload(scene);
  }
}
