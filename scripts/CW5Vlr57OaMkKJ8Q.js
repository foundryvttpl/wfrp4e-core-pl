if (this.actor.system.status.advantage.value >= 3)
{
    this.actor.modifyAdvantage(-3);
    this.script.notification("Odjęto Punkty Przewag")
}
else 
{
    return this.script.notification("Niewystarczająca liczba Punktów Przewag!", "error")
}

let test = await this.actor.setupTrait(this.item)
await test.roll();
