class LevelSystem {
  constructor(character) {
    this.character = character;
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = 100;
  }

  addExperience(amount) {
    this.experience += amount;
    if (this.experience >= this.experienceToNext) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.experience = 0;
    this.experienceToNext *= 1.5;

    // 스탯 증가
    this.character.config.walkSpeed += 10;
    this.character.config.attackDamage += 5;
  }
}
