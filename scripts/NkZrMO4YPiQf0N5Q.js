let test = await this.actor.setupCharacteristic("wp", {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, fields : {difficulty : "average"}, context : {failure: "Otrzymano 1 Punkt Zepsucia"}})
await test.roll();
if (test.failed && this.actor.type == "character")
{
    this.actor.update({"system.status.corruption.value" : parseInt(this.actor.status.corruption.value) + 1})
    this.script.message("Otrzymano Punkt Zepsucia", {whisper : ChatMessage.getWhisperRecipients("GM")})
}
