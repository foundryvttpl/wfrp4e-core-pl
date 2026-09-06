if (this.actor.hasCondition("broken"))
{
    this.actor.removeCondition("broken")
    this.script.notification(`Nie można otrzymać stanu Panika`);
}
