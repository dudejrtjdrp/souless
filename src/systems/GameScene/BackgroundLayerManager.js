export default class BackgroundLayerManager {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
  }

  createLayers() {
    const { mapConfig, mapModel } = this.scene;

    if (!mapConfig.layers?.length) {
      return [];
    }

    const repeatCount = mapConfig.repeatCount || 1;

    mapConfig.layers.forEach((layer, index) => {
      // 🔄 반복 횟수만큼 레이어 생성
      for (let i = 0; i < repeatCount; i++) {
        const img = this.createLayerImage(layer, i);
        this.scaleLayer(img);
        this.setLayerDepth(img, index);
        this.layers.push(img);
      }
    });

    mapModel.adjustBackgroundLayers(this.layers);
    return this.layers;
  }

  createLayerImage(layer, repeatIndex = 0) {
    const { autoScale } = this.scene.mapModel.config;
    const scale = this.scene.mapConfig.mapScale || autoScale || 1;

    // 단일 레이어의 너비 계산
    const texture = this.scene.textures.get(layer.key);
    const layerWidth = texture.source[0].width * scale;

    // X 오프셋 계산 (반복 인덱스 * 레이어 너비)
    const xOffset = layerWidth * repeatIndex;

    return this.scene.add.image(xOffset, 0, layer.key).setOrigin(0, 0);
  }

  scaleLayer(img) {
    const { autoScale } = this.scene.mapModel.config;
    const scale = this.scene.mapConfig.mapScale || autoScale || 1;
    img.setScale(scale);
  }

  setLayerDepth(img, index) {
    const depth = this.scene.mapConfig.depths.backgroundStart + index;
    img.setDepth(depth);
  }
}
