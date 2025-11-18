import Soul from '../entities/characters/playable/Soul';
import Monk from '../entities/characters/playable/Monk';
import Assassin from '../entities/characters/playable/Assassin';
import SkillIconLoader from './SkillIconLoader.js';
import Bladekeeper from '../entities/characters/playable/Bladekeeper.js';
import Fireknight from '../entities/characters/playable/Fireknight.js';
import Ranger from '../entities/characters/playable/Ranger.js';
import Mauler from '../entities/characters/playable/Mauler.js';
import Princess from '../entities/characters/playable/Princess.js';

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
