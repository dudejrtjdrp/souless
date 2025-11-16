import BaseSkillHandler from './BaseSkillHandler';

export default class MeleeSkillHandler extends BaseSkillHandler {
  execute(skillName, config, skillHitbox) {
    const frameRate = this.getFrameRate(config);
    // config.duration을 전달하지 않으면 애니메이션 길이로 자동 계산됨
    const lockTime = this.animationController.play(config.animation, frameRate);
    this.lockState(lockTime, skillName);
    this.activateHitbox(skillHitbox, config, lockTime);
  }

  lockState(duration, skillName) {
    const sprite = this.character.sprite;
    const body = sprite.body;
    const input = this.inputHandler.getInputState();

    let isAirborne = false;
    if (skillName === 'air_attack' || skillName === 's_skill') {
      isAirborne = !(body?.blocked.down || body?.onFloor?.());
    }

    if (isAirborne) {
      body.setVelocityY(0);
      body.setVelocityX(0);
      body.setAllowGravity(false);
    }
    this.stateLockManager.lock(duration, () => {
      if (isAirborne) {
        body.setAllowGravity(true);

        const landingChecker = this.scene.time.addEvent({
          delay: 50,
          loop: true,
          callback: () => {
            const hasLanded = body.blocked.down || body.touching.down || body.onFloor?.();
            if (!hasLanded) return;

            if (!input.isMoving) {
              this.animationController.playIdle();
            }
            let newState = 'walk';
            if (input.isRunning) {
              newState = 'run';
            }

            this.character.stateMachine.changeState(newState);

            landingChecker.remove();
          },
        });

        return;
      }

      // 지상 스킬은 바로 idle
      this.animationController.playPrevState();
    });
  }

  activateHitbox(skillHitbox, config, animationDuration) {
    if (!skillHitbox) return;

    if (config.hitboxSequence) {
      // hitboxSequence의 각 step에 duration 계산해서 전달
      const sequenceWithDuration = config.hitboxSequence.map((step) => ({
        ...step,
        duration: this.calculateStepDuration(step, animationDuration),
      }));
      skillHitbox.activateSequence(sequenceWithDuration);
    } else {
      const delay = config.hitboxDelay || 0;

      if (delay > 0) {
        this.scene.time.delayedCall(delay, () => skillHitbox.activate(animationDuration));
      } else {
        skillHitbox.activate(animationDuration);
      }
    }
  }

  calculateStepDuration(step, animationDuration) {
    // ⭐ 우선순위: step.duration > step.hitbox.duration > animationDuration
    if (step.duration) return step.duration;
    if (step.hitbox && step.hitbox.duration) return step.hitbox.duration;

    // 둘 다 없으면 애니메이션 duration 사용
    return animationDuration;
  }
}
