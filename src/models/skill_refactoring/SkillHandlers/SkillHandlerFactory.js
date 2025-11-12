import MeleeSkillHandler from './MeleeSkillHandler';
import MovementSkillHandler from './MovementSkillHandler';
import InstantSkillHandler from './InstantSkillHandler';
import ProjectileSkillHandler from './ProjectileSkillHandler';
import ChannelingSkillHandler from './ChannelingSkillHandler';

export default class SkillHandlerFactory {
  constructor(scene, character, animationController, stateLockManager) {
    this.handlers = {
      melee: new MeleeSkillHandler(scene, character, animationController, stateLockManager),
      projectile: new ProjectileSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
      ),
      movement: new MovementSkillHandler(scene, character, animationController, stateLockManager),
      channeling: new ChannelingSkillHandler(
        scene,
        character,
        animationController,
        stateLockManager,
      ),
      instant: new InstantSkillHandler(scene, character, animationController, stateLockManager),
    };
  }

  getHandler(type) {
    return this.handlers[type];
  }
}
