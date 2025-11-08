export default class MagicSystem {
  constructor(scene, casterSprite) {
    this.scene = scene;
    this.caster = casterSprite;
    this.projectiles = [];
  }

  castSpell(spellType, isLeft) {
    switch (spellType) {
      case 'fireball':
        return this.createFireball(isLeft);
      case 'ice_shard': // 추가
        return this.createIceSpike(isLeft);
      case 'lightning':
        return this.createLightning(isLeft);
    }
  }

  createFireball(isLeft) {
    const offsetX = isLeft ? -30 : 30;
    const velocityX = isLeft ? -400 : 400;

    const fireball = this.scene.add.circle(this.caster.x + offsetX, this.caster.y, 10, 0xff4400);

    this.scene.physics.add.existing(fireball);
    fireball.body.setVelocityX(velocityX);
    fireball.body.setAllowGravity(false);

    this.projectiles.push(fireball);

    this.scene.time.delayedCall(2000, () => {
      const index = this.projectiles.indexOf(fireball);
      if (index > -1) this.projectiles.splice(index, 1);
      fireball.destroy();
    });

    return fireball;
  }

  createIceSpike(isLeft) {
    const offsetX = isLeft ? -30 : 30;
    const velocityX = isLeft ? -300 : 300;

    const ice = this.scene.add.rectangle(this.caster.x + offsetX, this.caster.y, 15, 15, 0x00ccff);

    this.scene.physics.add.existing(ice);
    ice.body.setVelocityX(velocityX);
    ice.body.setAllowGravity(false);

    this.projectiles.push(ice);

    this.scene.time.delayedCall(3000, () => {
      const index = this.projectiles.indexOf(ice);
      if (index > -1) this.projectiles.splice(index, 1);
      ice.destroy();
    });

    return ice;
  }

  createLightning(isLeft) {
    const offsetX = isLeft ? -50 : 50;

    const lightning = this.scene.add.line(
      this.caster.x,
      this.caster.y - 100,
      0,
      0,
      offsetX,
      100,
      0xffff00,
      1,
    );
    lightning.setLineWidth(3);

    this.scene.time.delayedCall(200, () => {
      lightning.destroy();
    });

    return lightning;
  }

  destroy() {
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles = [];
  }
}
