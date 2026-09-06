if (this.actor.hasCondition("surprised"))
{
    this.actor.removeCondition("surprised")
    this.script.message(`Nie może być zaskoczony!`);
}
