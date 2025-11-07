// characters/base/CharacterFactory.js
import Soul from '../playable/Soul.js';
import Soldier from '../playable/Soldier.js';
import Magician from '../playable/Magician.js';
import Monk from '../playable/Monk.js';

export default class CharacterFactory {
  static create(scene, type, x, y, options = {}) {
    const characterMap = {
      soul: Soul,
      soldier: Soldier,
      magician: Magician,
      monk: Monk,
    };

    const CharacterClass = characterMap[type.toLowerCase()];

    if (!CharacterClass) {
      throw new Error(`Unknown character type: ${type}`);
    }

    return new CharacterClass(scene, x, y, options);
  }

  static createMultiple(scene, characters) {
    return characters.map((char) => this.create(scene, char.type, char.x, char.y, char.options));
  }

  static getAvailableTypes() {
    return ['soul', 'soldier', 'magician', 'monk'];
  }
}
