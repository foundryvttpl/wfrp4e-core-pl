args.applyAP = false;

    this.script.notification("Ten test dotyczy tylko przestępców, w przeciwnym razie zamknij okno dialogowe.");
    this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {fields : {difficulty : "average"}, skipTargets: true, appendTitle :  ` - ${this.effect.name}`}).then(async test => 
    {
      await test.roll();
      if (test.failed)
      {
        args.actor.addCondition("unconscious");
      }
    });
