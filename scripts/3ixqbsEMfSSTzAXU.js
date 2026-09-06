const test = await this.actor.setupSkill(game.i18n.localize("NAME.Cool"), {
  difficulty: "challenging",
  context: {
    failure: "Otrzymuje stan @Condition[Zmęczenie] z powodu koszmarów.",
    success: "Cierpiał na koszmary, ale spał wystarczająco dobrze."
  }
});
await test.roll();

if (test.failed) {
  await this.actor.addCondition("fatigued");
}
