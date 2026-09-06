let fatigued = this.actor.hasCondition("fatigued")
if (!fatigued)
{
    this.actor.addCondition("fatigued")
    ui.notifications.notify("Zmęczenie dodane do " + this.actor.name + ", które nie może zostać usunięte, dopóki objaw Apatia nie zostanie uleczony.")
}
