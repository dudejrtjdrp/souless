import Phaser from 'phaser';

// ParallaxManager: 배경 레이어를 생성하고 카메라 움직임에 따라 스크롤을 처리하는 클래스입니다.
export default class ParallaxManager {
  constructor(scene, target, backgroundConfig = [], mapScale = 1) {
    this.scene = scene;
    this.target = target;
    this.mapScale = mapScale; // 💡 맵 스케일 추가
    this.layers = [];
    this.backgroundConfig = backgroundConfig;

    this.createLayers();
  }

  createLayers() {
    // 맵의 크기 (월드 크기)
    const worldWidth = this.scene.physics.world.bounds.width;
    const worldHeight = this.scene.physics.world.bounds.height;

    this.backgroundConfig
      // depth가 낮은(더 뒤쪽) 레이어부터 먼저 생성하도록 정렬
      .sort((a, b) => a.depth - b.depth)
      .forEach((config) => {
        // 이미지를 씬에 추가합니다.
        const layer = this.scene.add.image(0, 0, config.key);

        // 💡 1. 맵 스케일 적용: 맵 전체 크기에 맞추어 배경 이미지의 스케일을 조정합니다.
        layer.setScale(this.mapScale);

        // 💡 2. 원점 설정: Tiled 맵과 동일하게 (0, 0)을 기준으로 설정합니다.
        layer.setOrigin(0, 0);

        // 💡 3. 초기 위치 설정: 레이어를 월드의 (0, 0)에 배치합니다.
        // ParallaxManager의 update 로직에서 수동으로 위치를 조정하기 위해 scrollFactor는 0으로 유지
        layer.setScrollFactor(0);

        // 깊이(Depth) 설정
        layer.setDepth(config.depth);

        // 🚨 중요: 만약 배경 이미지가 맵 전체를 덮지 못하면,
        // 여기서 이미지를 복제하거나 Tiling Sprite를 사용해야 할 수 있습니다.
        // 현재는 단일 이미지가 맵 전체를 덮는다고 가정합니다.

        this.layers.push({ layer, factor: config.scrollFactor });
      });

    console.log(`[ParallaxManager] ✅ ${this.layers.length} background layers created.`);
  }

  // 매 프레임마다 호출되어 배경을 스크롤합니다.
  update(delta) {
    if (!this.target) return;

    // 카메라의 현재 스크롤 위치를 가져옵니다.
    const scrollX = this.scene.cameras.main.scrollX;
    const scrollY = this.scene.cameras.main.scrollY;

    this.layers.forEach(({ layer, factor }) => {
      // 레이어의 X, Y 위치를 카메라 스크롤 위치와 스크롤 팩터에 따라 조정합니다.
      // factor가 1.0에 가까울수록 플레이어와 함께 움직이고, 0에 가까울수록 고정됩니다.

      // 💡 layer.x와 layer.y는 항상 씬의 뷰포트(카메라가 보고 있는 영역)의 (0, 0)을 기준으로 움직여야 합니다.
      // layer.setScrollFactor(0) 이므로, layer.x = 0 이면 화면 왼쪽 끝에 고정됩니다.
      // Parallax 효과를 위해 카메라 스크롤에 반비례하여 움직이도록 조정합니다.
      layer.x = scrollX * (1 - factor);
      layer.y = scrollY * (1 - factor);
    });
  }
}
