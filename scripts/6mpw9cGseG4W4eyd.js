if (this.actor.system.status.advantage.value >= 2)
{
    await this.actor.modifyAdvantage(-2);
    this.script.notification("Zmniejszono Punkty Przewag")
}
else 
{
    return this.script.notification("Brak Wymaganych Punktów Przewag!", "error")
}

let test = await this.actor.setupTrait(this.item)
await test.roll();
