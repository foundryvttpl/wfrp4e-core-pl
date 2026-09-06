let spells = await warhammer.utility.findAllItems("spell", "Ładowanie Zaklęć", true, ["system.lore.value"])

let text = (await game.wfrp4e.tables.rollTable("random-caster", {hideDSN: true})).result

lore = Array.from(text.matchAll(/{(.+?)}/gm))[0][1]

if (text == "Wybór GMa")
{
    return this.script.notification(text)
}

if (spellsWithLore.length > 0)
{
    let spellsWithLore = spells.filter(i => game.wfrp4e.config.magicLores[i.system.lore.value] == lore)
    let selectedSpell = spellsWithLore[Math.floor(CONFIG.Dice.randomUniform() * spellsWithLore.length)]
    this.script.notification(selectedSpell.name);
    this.actor.createEmbeddedDocuments("Item", [(await fromUuid(selectedSpell)).toObject()])
}
else
{
    ui.notifications.notify(`Nie udało się odnaleźć zaklęcia w Tradycji ${lore}. Spróbuj ponownie.`)
}
