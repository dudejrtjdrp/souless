export default {
  currentTarget: null,
  setTarget(enemy) {
    this.currentTarget = enemy;
  },
  clearTarget() {
    this.currentTarget = null;
  },
};
