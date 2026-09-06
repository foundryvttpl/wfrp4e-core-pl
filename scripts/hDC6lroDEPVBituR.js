let test = await this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {skipTargets: true, appendTitle :  ` - ${this.effect.name}`})
await test.roll();

if (test.failed)
{
    this.actor.update({"system.status.corruption.value" : parseInt(this.actor.status.corruption.value) + 1})
    this.script.message("Otrzymano Punkt Zepsucia", {whisper : ChatMessage.getWhisperRecipients("GM")})
    if (test.result.roll % 11 == 0 || test.result.roll == 100)
    {
        this.script.message(`<strong>Pech</strong>: Natychmiast otrzymujesz 1 @Table[mutatemental]{Mutację Psychiczną}, oraz nie możesz podjąć się krótko-terminowej ambicji przez następne [[1d10]] tygodni.`, {whisper : ChatMessage.getWhisperRecipients("GM")})
    }
}
