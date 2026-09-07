let test = await this.actor.setupCharacteristic("wp", {skipTargets: true, appendTitle :  " - " + this.effect.name, context : {failure: "Otrzymano Stan Oszołoemienia"}})
await test.roll();
if (test.failed)
{
    this.actor.addCondition("stunned");
}
