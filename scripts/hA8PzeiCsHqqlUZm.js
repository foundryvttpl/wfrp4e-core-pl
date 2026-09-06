this.actor.createEmbeddedDocuments("ActiveEffect", [game.wfrp4e.config.symptomEffects["nausea"]])
this.script.message(`Otrzymano symptom: @Symptom[Mdłości] na [[1d10]] godzin`, {whisper: ChatMessage.getWhisperRecipients("GM")})
