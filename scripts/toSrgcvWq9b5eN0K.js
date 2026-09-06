let location = await game.wfrp4e.tables.rollTable("hitloc", {hideDSN: true})

this.item.updateSource({name : `${this.item.name} (${location.description})`})
this.script.message(`<strong>Miejsce:</strong> ${location.description}`, { whisper: ChatMessage.getWhisperRecipients("GM") })
