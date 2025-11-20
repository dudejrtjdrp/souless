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
import SaveSlotManager from '../../../utils/SaveSlotManager.js';

export default class CharacterFactory {
  // 초기 캐릭터 (항상 사용 가능)
  static INITIAL_CHARACTERS = ['soul'];

  // 모든 캐릭터 매핑
  static CHARACTER_MAP = {
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

  // 현재 사용 가능한 모든 캐릭터 (직업 순서)
  static ALL_CHARACTERS = [
    'soul',
    'assassin',
    'monk',
    'bladekeeper',
    'fireknight',
    'mauler',
    'princess',
    // 'ranger', // 비활성화
  ];

  static create(scene, type, x, y, options = {}) {
    const CharacterClass = this.CHARACTER_MAP[type.toLowerCase()];

    if (!CharacterClass) {
      throw new Error(`Unknown character type: ${type}`);
    }

    return new CharacterClass(scene, x, y, options);
  }

  static createMultiple(scene, characters) {
    return characters.map((char) => this.create(scene, char.type, char.x, char.y, char.options));
  }

  /**
   * 저장된 데이터에 따라 사용 가능한 캐릭터 반환
   * - 초기: ['soul']만 사용 가능
   * - 보스 처치 후: availableTypes에 추가된 캐릭터만 사용 가능
   */
  static async getAvailableCharacters() {
    const saveData = await SaveSlotManager.load();

    // 초기 캐릭터는 항상 포함
    let availableTypes = [...this.INITIAL_CHARACTERS];

    // 저장된 데이터에서 해금된 캐릭터 추가
    if (saveData && saveData.availableTypes && Array.isArray(saveData.availableTypes)) {
      availableTypes = [...new Set([...availableTypes, ...saveData.availableTypes])];
    }

    return availableTypes;
  }

  // CharacterSelectOverlay 등에서 빠르게 접근해야 할 때만 사용
  static getAvailableTypes() {
    // ✅ 이제는 모든 가능한 캐릭터를 반환 (실제 제한은 UI에서 처리)
    return this.ALL_CHARACTERS;
  }

  /**
   * 특정 캐릭터가 해금되었는지 확인
   */
  static async isUnlocked(characterType) {
    const available = await this.getAvailableCharacters();
    return available.includes(characterType);
  }

  /**
   * 캐릭터가 존재하는지 확인
   */
  static exists(characterType) {
    return characterType in this.CHARACTER_MAP;
  }

  /**
   * 모든 캐릭터 목록 반환 (관리자용)
   */
  static getAllCharacters() {
    return Object.keys(this.CHARACTER_MAP);
  }
}
