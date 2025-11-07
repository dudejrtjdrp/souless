import Soul from '../characters/playable/Soul';
import Monk from '../characters/playable/Monk';

export default class CharacterAssetLoader {
  static preload(scene) {
    Soul.preload(scene);
    Monk.preload(scene);
  }
}
