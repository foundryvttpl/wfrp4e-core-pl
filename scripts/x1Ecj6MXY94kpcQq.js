if (!this.item.equipped.value) {
  return this.script.notification(`Musisz wyposazyc ${this.item.name}, aby odzyskac Rany.`,"info")
}

const runesOfRestoration = this.item.effects.contents.filter(e => e.name == this.effect.name)
const restorationWounds = parseInt(runesOfRestoration.length * this.actor.system.characteristics.t.bonus)

this.actor.modifyWounds(restorationWounds)
this.script.message(`Odzyskano ${restorationWounds} Ran dzieki ${this.script.label}.`)
