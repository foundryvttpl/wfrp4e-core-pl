let test = await args.actor.setupSkill(game.i18n.localize("NAME.Cool"), {skipTargets: true, appendTitle :  " - " + this.effect.name, context: { failure: "Otrzymano Stan Panika", success: "Uniknięto otrzymania Stanu Panika" } })

 await test.roll();

 if (!test.succeeded)
 {
    args.actor.addCondition("broken");
 }
