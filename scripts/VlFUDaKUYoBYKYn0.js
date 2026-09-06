let test = await this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, context : {failure: "Otrzymano 1 Punkt Zepsucia"}})
await test.roll();
if (test.failed && this.actor.type == "character")
{
    this.actor.update({"system.status.corruption.value" : parseInt(this.actor.status.corruption.value) + 1})
    this.script.message("Otrzymano 1 Punkt Zepsucia", {whisper : ChatMessage.getWhisperRecipients("GM")})
}
