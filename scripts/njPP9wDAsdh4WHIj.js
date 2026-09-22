if (args.totalWoundLoss > 0 && ["trait", "weapon"].includes(args.sourceItem?.type))
{
     this.script.message(`<b>Infekcja: ${args.actor.name}</b> musi zdać <b>Prosty (+40) Test Odporności</b> albo otrzyma @UUID[Compendium.wfrp4e-core.items.kKccDTGzWzSXCBOb]{Ropiejącą Ranę}`, {whisper: ChatMessage.getWhisperRecipients("GM")})
}
