if (args.test.characteristicKey == "wp") 
{
    if (args.test.failed)
    {
        this.actor.createEmbeddedDocuments("ActiveEffect", [game.wfrp4e.config.symptomEffects["malaise"]])
        this.script.message(`Test Siły Woli nie udał się, <b>${this.actor.prototypeToken.name}</b>: Otrzymano @Symptom[Apatia]{Apatię} na [[1d10]] godzin`, {whisper: ChatMessage.getWhisperRecipients("GM")})
    }
}
