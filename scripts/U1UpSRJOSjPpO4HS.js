let mutations = await warhammer.utility.findAllItems("mutation", "Wczytywanie Mutacji...", true)
let roll = Math.floor(CONFIG.Dice.randomUniform() * mutations.length);
this.actor.createEmbeddedDocuments("Item", [(await fromUuid(mutations[roll].uuid)).toObject()]);
this.script.notification(`Otrzymano: ${mutations[roll].name}`)
