export default class CameraController {
  constructor(scene, target, backgroundLayers = [], config = {}) {
    this.scene = scene;
    this.target = target; // 플레이어나 추적할 대상
    this.layers = backgroundLayers;

    this.smoothX = config.smoothX ?? 0.1; // X축 추적 부드러움
    this.fixedY = config.fixedY ?? null; // Y축 고정값, null이면 자유 이동
  }

  update() {
    const cam = this.scene.cameras.main;

    // X축만 target 따라가기
    cam.scrollX += (this.target.x - cam.scrollX - cam.width / 2) * this.smoothX;

    // Y축 고정값이 있으면 고정, 없으면 target 따라가기
    if (this.fixedY !== null) {
      cam.scrollY = this.fixedY;
    } else {
      cam.scrollY += (this.target.y - cam.scrollY - cam.height / 2) * (this.smoothY ?? 0.1);
    }

    const camX = cam.scrollX;
    const camY = cam.scrollY;

    // Parallax 레이어 위치 업데이트
    this.layers.forEach((layer) => {
      layer.x = -camX * (layer.parallaxSpeed ?? 0);
      layer.y = -camY * (layer.parallaxSpeedY ?? 0);
    });
  }
}
