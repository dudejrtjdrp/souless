import Soul from '../characters/playable/Soul';
import Monk from '../characters/playable/Monk';
import Assassin from '../characters/playable/Assassin';
import SkillIconLoader from './SkillIconLoader.js';
import Bladekeeper from '../characters/playable/Bladekeeper.js';
import Fireknight from '../characters/playable/Fireknight.js';
import Ranger from '../characters/playable/Ranger.js';
import Mauler from '../characters/playable/Mauler.js';
import Princess from '../characters/playable/Princess.js';

export default class CharacterAssetLoader {
  static preload(scene) {
    Soul.preload(scene);
    Monk.preload(scene);
    Assassin.preload(scene);
    Bladekeeper.preload(scene);
    Fireknight.preload(scene);
    Ranger.preload(scene);
    Mauler.preload(scene);
    Princess.preload(scene);
    SkillIconLoader.preload(scene);
  }
}
