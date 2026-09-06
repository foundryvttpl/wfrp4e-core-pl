this.actor.has("Niewrażliwość na Psychologię")?.delete();

let roll = await new Roll("1d10").roll({allowInteractive : false});

roll.toMessage(this.script.getChatData());

this.script.notification(`Usunięto odporność na psychologię, otrzymano Stany Paniki: ${roll.total}`)
this.actor.addCondition("broken", roll.total, {"flags.wfrp4e.blasted-mind" : true})
