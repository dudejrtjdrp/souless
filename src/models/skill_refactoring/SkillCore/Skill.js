const DEFAULT_CHANNEL_TICK_INTERVAL = 100;

export class Skill {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.cooldownRemaining = 0;
    this.isActive = false;
    this.activeStartTime = 0;
    this.isChanneling = false;
    this.channelStartTime = 0;
    this.channelTickInterval = config.channelTickInterval || DEFAULT_CHANNEL_TICK_INTERVAL;
    this.lastTickTime = 0;
    this.pendingCooldown = false; // 애니메이션 완료 대기 중인 쿨타임
  }

  canUse(character) {
    return (
      this.cooldownRemaining === 0 &&
      !this.isActive && // 스킬 사용 중에는 재사용 불가
      this.hasSufficientMana(character) &&
      this.meetsGroundRequirement(character)
    );
  }

  hasSufficientMana(character) {
    return !this.config.cost?.mana || character.mana >= this.config.cost.mana;
  }

  hasSufficientManaForChanneling(character) {
    // 채널링 스킬의 경우 manaPerTick도 체크
    if (this.config.channeling?.manaPerTick) {
      return character.mana >= this.config.channeling.manaPerTick;
    }
    return true;
  }

  meetsGroundRequirement(character) {
    return !this.config.requiresGround || character.movement.isOnGround();
  }

  use(character) {
    if (!this.canUse(character)) return false;

    this.consumeResources(character);
    this.activate();
    // 쿨타임은 여기서 시작하지 않음 - 애니메이션 완료 후 시작

    return true;
  }

  consumeResources(character) {
    if (this.config.cost?.mana) {
      character.mana -= this.config.cost.mana;
    }
  }

  startCooldown() {
    if (this.config.cooldown) {
      this.cooldownRemaining = this.config.cooldown;
      this.pendingCooldown = false;
    }
  }

  activate() {
    this.isActive = true;
    this.activeStartTime = Date.now();
    this.pendingCooldown = true; // 쿨타임 대기 상태

    if (this.config.channeling) {
      this.startChanneling();
    }
  }

  // 애니메이션/스킬이 완료되었을 때 호출
  complete() {
    this.isActive = false;

    // 애니메이션이 끝났으므로 이제 쿨타임 시작
    if (this.pendingCooldown) {
      this.startCooldown();
    }
  }

  startChanneling() {
    this.isChanneling = true;
    this.channelStartTime = Date.now();
    this.lastTickTime = Date.now();
  }

  stopChanneling() {
    this.isChanneling = false;
    this.complete(); // 채널링 중단 시 완료 처리
  }

  update(delta) {
    this.updateCooldown(delta);

    // 채널링이 아닌 일반 스킬의 duration 체크
    if (this.isActive && !this.isChanneling && this.config.duration) {
      const elapsed = Date.now() - this.activeStartTime;
      if (elapsed >= this.config.duration) {
        this.complete();
      }
    }

    // 채널링 중이고 maxDuration을 초과하면 자동 종료
    if (this.isChanneling && this.config.channeling?.maxDuration) {
      const elapsedTime = Date.now() - this.channelStartTime;
      if (elapsedTime >= this.config.channeling.maxDuration) {
        this.stopChanneling();
      }
    }
  }

  updateCooldown(delta) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }
  }

  updateDuration() {
    if (this.isActive && this.config.duration) {
      const elapsed = Date.now() - this.activeStartTime;
      if (elapsed >= this.config.duration) {
        this.complete(); // duration이 끝나면 완료 처리
      }
    }
  }

  isOnCooldown() {
    return this.cooldownRemaining > 0;
  }

  getCooldownPercent() {
    if (!this.config.cooldown) return 0;
    return (this.cooldownRemaining / this.config.cooldown) * 100;
  }
}
