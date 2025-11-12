import Soul from '../playable/Soul.js';
import Soldier from '../playable/Soldier.js';
import Magician from '../playable/Magician.js';
import Monk from '../playable/Monk.js';
import Assassin from '../playable/Assassin.js';
import Bladekeeper from '../playable/Bladekeeper.js';
import Fireknight from '../playable/Fireknight.js';
import Ranger from '../playable/Ranger.js';
import Mauler from '../playable/Mauler.js';
import Princess from '../playable/Princess.js';

export default class CharacterFactory {
  static create(scene, type, x, y, options = {}) {
    const characterMap = {
      soul: Soul,
      soldier: Soldier,
      magician: Magician,
      monk: Monk,
      assassin: Assassin,
      bladekeeper: Bladekeeper,
      fireknight: Fireknight,
      ranger: Ranger,
      mauler: Mauler,
      princess: Princess,
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
    return [
      'soul',
      'assassin',
      'monk',
      'bladekeeper',
      'fireknight',
      'ranger',
      'mauler',
      'princess',
    ];
  }
}
