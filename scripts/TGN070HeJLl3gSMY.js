let test = await this.actor.setupCharacteristic("ag", {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, context: { failure: "Upadek" }})
await test.roll();
if (test.failed)
{
    this.actor.addCondition("prone");
}
