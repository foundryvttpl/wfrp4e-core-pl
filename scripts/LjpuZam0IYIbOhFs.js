const test = await args.actor.setupSkill(game.i18n.localize("NAME.Navigation"), {
  skipTargets: true,
  appendTitle: ` — ${this.effect.name}`,
  fields: {difficulty: "vhard"},
  context: {
    failure: "Nie moze wykonywac akcji poza wedrowaniem w losowym kierunku zwyklym tempem marszu.",
    success: "Moze dzialac normalnie."
  }
});

await test.roll();
