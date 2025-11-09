import Soul from '../characters/playable/Soul';
import Monk from '../characters/playable/Monk';
import Assassin from '../characters/playable/Assassin';

export default class CharacterAssetLoader {
  static preload(scene) {
    Soul.preload(scene);
    Monk.preload(scene);
    Assassin.preload(scene);
  }
}
