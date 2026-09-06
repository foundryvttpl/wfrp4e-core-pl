let msg = `<b>${this.actor.prototypeToken.name}</b>: Otrzymano 1 Ranę.<br>`
  if (this.actor.status.wounds.value <= 1)
  {
    msg += `<b>${this.actor.prototypeToken.name}</b>: Otrzymano Stan @Condition[Utrata Przytomności].<br>`
    await this.actor.addCondition("unconscious")
  }
  this.script.message(msg)
  this.actor.modifyWounds(-1)
