import Canine from '../characters/enemies/Canine.js';
import Slime from '../characters/enemies/Slime.js';
import Bat from '../characters/enemies/Bat.js';
import PurpleMonkey from '../characters/enemies/PurpleMonkey.js';

export default class EnemyAssetLoader {
  static preload(scene) {
    Slime.preload(scene);
    Canine.preload(scene);
    Bat.preload(scene);
    PurpleMonkey.preload(scene);
  }
}
