export default class EnemyAssetLoader {
  static preload(scene) {
    // Slime
    scene.load.spritesheet('slime_idle', '/assets/enemy/slime/Slime_Spiked_Idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('slime_hit', '/assets/enemy/slime/Slime_Spiked_Hit.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('slime_death', '/assets/enemy/slime/Slime_Spiked_Death.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Bat
    scene.load.spritesheet('bat_idle', '/assets/enemy/bat/Bat_Spiked_Idle.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('bat_hit', '/assets/enemy/bat/Bat_Spiked_Hit.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet('bat_death', '/assets/enemy/bat/Bat_Spiked_Death.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Bat
    scene.load.spritesheet('canine_idle', '/assets/enemy/canine/Canine_White_Idle.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    scene.load.spritesheet('canine_hit', '/assets/enemy/canine/Canine_White_Hit.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    scene.load.spritesheet('canine_death', '/assets/enemy/canine/Canine_White_Death.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }
}
