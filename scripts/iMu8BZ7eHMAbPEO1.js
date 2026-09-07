let healed = args.totalWoundLoss

this.script.message(`<b>this.actor.prototypeToken.name</b>Uleczone Rany: ${healed}`);

this.actor.modifyWounds(healed)
