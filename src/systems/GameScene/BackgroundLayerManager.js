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

    mapConfig.layers.forEach((layer, index) => {
      const img = this.createLayerImage(layer);
      this.scaleLayer(img);
      this.setLayerDepth(img, index);
      this.layers.push(img);
    });

    mapModel.adjustBackgroundLayers(this.layers);
    return this.layers;
  }

  createLayerImage(layer) {
    return this.scene.add.image(0, 0, layer.key).setOrigin(0, 0);
  }

  scaleLayer(img) {
    const { autoScale } = this.scene.mapModel.config;
    const scale = autoScale || this.scene.mapConfig.mapScale || 1;
    img.setScale(scale);
  }

  setLayerDepth(img, index) {
    const depth = this.scene.mapConfig.depths.backgroundStart + index;
    img.setDepth(depth);
  }
}
