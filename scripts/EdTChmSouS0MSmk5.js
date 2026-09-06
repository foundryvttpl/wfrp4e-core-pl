let test = await this.actor.setupCharacteristic("wp", {skipTargets: true, appendTitle :  ` - ${this.effect.name}`})
await test.roll();
if (test.succeeded)
{
    this.script.message("Można wykonać Akcję lub Ruch w tej rundzie (wybierz jedno)")
}
else 
{
    this.script.message("Nie można wykonać Akcji ani Ruchu w tej rundzie")
}
