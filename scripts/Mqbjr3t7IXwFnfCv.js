if (this.item.flags.runeOfIron) return


const runesOfIron = this.item.effects.contents.filter(e => e.name == this.effect.name)
const ironWounds = parseInt(runesOfIron.length * 2)
const currentWounds = this.actor.system.status.wounds.value

if (args.equipped) {
  this.item.flags.runeOfIron = true
  this.actor.modifyWounds(ironWounds)
}
else
{
  this.item.flags.runeOfIron = true
  this.actor.modifyWounds(-ironWounds)
  if (ironWounds > currentWounds) {
    this.script.message(`Usunieto ${ironWounds} Ran przez zdjecie pancerza runicznego, ale postac miala tylko ${currentWounds} pozostalych Ran. This may trigger a critical injury.`)
  }
}
