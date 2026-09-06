this.actor.setupSkill(game.i18n.localize("NAME.Cool"), {appendTitle: ` - ${this.effect.name}`, context: { failure : "Nie może uciec z walki"}}).then(test => test.roll())
