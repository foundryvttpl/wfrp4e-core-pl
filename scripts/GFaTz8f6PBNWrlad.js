let test = await this.actor.setupCharacteristic("wp", {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, context : {failure : `<strong>Zdezorientowany</strong>: Determine behaviour by @Table[bewilder] Table.`}})
await test.roll();
return test.failed
