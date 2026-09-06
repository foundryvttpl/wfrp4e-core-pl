if (this.actor.hasCondition("surprised"))
{
    this.script.notification("Nie może zostać zaskoczony");
    this.actor.removeCondition("surprised");
}
