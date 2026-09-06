if (this.actor.system.status.advantage.value >= 2)
{
    await this.actor.modifyAdvantage(-2);
    this.script.notification("Odjeto Przewage")
}
else 
{
    return this.script.notification("Za malo Przewagi!", "error")
}

let test = await this.actor.setupTrait(this.item)
await test.roll();
