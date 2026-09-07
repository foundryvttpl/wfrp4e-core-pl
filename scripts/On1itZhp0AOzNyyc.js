let test = await this.actor.setupSkill("Runotworstwo", {appendTitle: ` - ${this.effect.name}`});
await test.roll();
this.effect.update({"disabled" : true});
