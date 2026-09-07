if (args.totalWoundLoss >= 1)
{
    let roll = await new Roll("1d10").roll({allowInteractive : false});
    await roll.toMessage(this.script.getChatData());
    if (roll.total == 9)
    {
        this.script.message(`Dwa @UUID[Compendium.wfrp4e-eis.actors.cLOGeMqUty61nYB9]{Niebieskie Horrory Tzeentcha} wydostają się z ciała ${this.actor.name}, jednocześnie doprowadzając do śmierci.`, {whisper : ChatMessage.getWhisperRecipients("GM")})
    }
}
