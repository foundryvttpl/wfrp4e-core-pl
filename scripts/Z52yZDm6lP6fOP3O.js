let ablaze = this.actor.hasCondition("ablaze")
if (ablaze)
{
    this.script.notification("Niewrażliwość na Podpalenie");
    ablaze.delete()
}
