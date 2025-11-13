import MeleeSkillHandler from './MeleeSkillHandler';
import MovementSkillHandler from './MovementSkillHandler';
import InstantSkillHandler from './InstantSkillHandler';
import ProjectileSkillHandler from './ProjectileSkillHandler';
import ChannelingSkillHandler from './ChannelingSkillHandler';

export default class SkillHandlerFactory {
  constructor(scene, character, animationController, stateLockManager, inputhandler) {
    this.handlers = {
      melee: new MeleeSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
        inputhandler,
      ),
      projectile: new ProjectileSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
        inputhandler,
      ),
      movement: new MovementSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
        inputhandler,
      ),
      channeling: new ChannelingSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
        inputhandler,
      ),
      instant: new InstantSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
        inputhandler,
      ),
    };
  }

  getHandler(type) {
    return this.handlers[type];
  }
}
