if (this.actor.hasCondition("ablaze"))
{
    this.script.notification("Niewrażliwość na Podpalenie")
    await this.actor.hasCondition("ablaze")?.delete()
}
