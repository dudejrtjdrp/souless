import { MAPS } from '../../config/mapData.js';

export default class GameSceneInitializer {
  /**
   * GameScene의 init 단계에서 핵심 프로퍼티를 초기화합니다.
   * @param {Phaser.Scene} scene - 초기화할 GameScene 인스턴스
   * @param {object} data - 씬에 전달된 데이터 (mapKey, characterType 등)
   */
  static async initializeScene(scene, data) {
    scene.currentMapKey = data.mapKey || 'forest'; // 'forest'를 기본값으로 설정
    scene.selectedCharacter = data.characterType || 'assassin';

    scene.mapConfig = GameSceneInitializer.loadMapConfig(scene);
  }

  static loadMapConfig(scene) {
    // 이 함수는 scene.currentMapKey가 설정되어 있다고 가정합니다.
    // (위 initializeScene에서 설정했으므로 OK)
    const mapConfig = MAPS[scene.currentMapKey];

    if (!mapConfig) {
      console.error(`❌ Map config not found: "${scene.currentMapKey}"`);
      scene.currentMapKey = 'forest';
      return MAPS['forest'];
    }

    return mapConfig;
  }

  static async waitForUIReady(scene) {
    return new Promise((resolve) => {
      if (scene.uiScene?.expBar && scene.uiScene?.healthMana) {
        resolve();
      } else {
        scene.uiScene.events.once('ui-ready', resolve);
      }
    });
  }
}
