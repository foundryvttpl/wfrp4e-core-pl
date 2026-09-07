let spells = await warhammer.utility.findAllItems("spell", "Wczytywanie Zaklęć...", true, ["system.lore.value"])

let lore = (await game.wfrp4e.tables.rollTable("random-caster", {hideDSN: true})).text
this.script.notification(lore)
if (lore == "Wybór Mistrza Gry") {
   return
}

else if (lore == "Magia Tajemna") {
    lore = "Magia Tajemna"
}

else if (lore == "Magia Prosta") {
    lore = "petty"
}

else {
    lore = lore.toLowerCase();
}

let spellsWithLore = []
if (lore == "Magia Tajemna") {
    spellsWithLore = spells.filter(i => !i.system.lore.value)
}
else {
    spellsWithLore = spells.filter(i => i.system.lore.value == lore)
}

let selectedSpell = spellsWithLore[Math.floor(CONFIG.Dice.randomUniform() * spellsWithLore.length)]
Item.implementation.create(selectedSpell.toObject(), { parent: this.actor}).then(item => {
    this.actor.setupCast(item).then(test => test.roll());
})
