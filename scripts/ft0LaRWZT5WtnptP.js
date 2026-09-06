let advantage = this.actor.system.status.advantage.value;
if (advantage > 0)
{
    await this.actor.setAdvantage(0);
    this.script.notification("Zmniejszono Punkty Przewag")
}
else 
{
    return this.script.notification("Niewystarczająca liczba Punktów Przewag!", "error")
}

let test = await this.actor.setupTrait(this.item, {fields : {slBonus : advantage}})
await test.roll();
