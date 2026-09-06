let runes = this.actor.itemTypes["wfrp4e-dwarfs.rune"]
if (runes.length === 0) return ui.notifications.error("Ta postac nie zna zadnych run.")

let rune = await ItemDialog.create(this.actor.itemTypes["wfrp4e-dwarfs.rune"], 1, {text: "Wybierz rune", title: this.effect.name})
rune[0].system.use({initialTooltip: "Premia Kowadla Zaglady", fields: {modifier: 20}})
