// Apply changes when the mask is worn

if (args.equipped) 
{  
  this.actor.createEmbeddedDocuments("ActiveEffect", [this.item.effects.contents[1]?.convertToApplied()])  
  this.script.message(`<strong>${this.item.name}</strong> została założona przez ${this.actor.name}. <br>
      Jeśli maska jest noszona przez ponad godzinę lub wykorzystane są jej efekty, postać jest wystawiona na @Corruption[moderate]{Przeciętne Zepsucie}`,
      {whisper: ChatMessage.getWhisperRecipients("GM")}) 
}

// Notify of lingering effects when mask is removed
else if (!args.equipped)
{
    await this.item.effects.contents[0].delete();
    await this.item.update({name : this.item.name += " (Wykorzystana)"})
    this.script.message(`<strong>${this.item.name}</strong> noszona przez ${this.actor.name} została zdjęta i utraciła swoje właściwości. Jednak jej efekty trwają przez [[1d10+4]] dni, po czym powinny zostać ręcznie usunięte.`, 
    {whisper: ChatMessage.getWhisperRecipients("GM")}
    )
    
}
