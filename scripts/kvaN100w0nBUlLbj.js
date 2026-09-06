let poisoned = this.actor.hasCondition("poisoned")
if (poisoned)
{
    this.script.message("Niewrażliwość na trucizny!")
    poisoned.delete()
}
