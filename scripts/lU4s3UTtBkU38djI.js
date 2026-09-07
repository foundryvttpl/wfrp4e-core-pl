this.actor.addCondition("entangled")
let msg = `<b>${this.actor.prototypeToken.name}</b>: Utracono 1 Punkt Żywotności oraz otrzymano 1 Stan @Condition[Pochwycenie].`
this.script.message(msg)
this.actor.modifyWounds(-1)
