if (args.totalWoundLoss >= 1)
{
    let roll = await new Roll("1d10").roll({allowInteractive : false});
    await roll.toMessage(this.script.getChatData());
    if (roll.total == 9)
    {
        this.script.message(`Dwa @UUID[Compendium.wfrp4e-eis.actors.iDy8SDTwJSlCzZMl]{Niebieskie Horrory Tzeentch} rozrywają na strzępy ${this.actor.name}' wydostając się na świat.`, {whisper : ChatMessage.getWhisperRecipients("GM")})
    }
}
