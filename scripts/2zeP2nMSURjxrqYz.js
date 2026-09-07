let wounds = this.actor.system.status.wounds
if (wounds.value == 0)
  return this.script.notification("Brak efektu, ponieważ Żywotność wynosi 0", "error")

this.script.notification(`Wyleczone Punkty Żywotności: ${this.actor.characteristics.t.bonus}`)
await this.actor.modifyWounds(this.actor.characteristics.t.bonus)
