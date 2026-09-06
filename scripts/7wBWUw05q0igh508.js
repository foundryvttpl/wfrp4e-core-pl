// Imbibing this substance grants the user the Painless Creature Trait.
const hasPainless = this.actor.has("Nie Czuje Bólu");
if (hasPainless === undefined) 
{
  let item = await fromUuid("Compendium.wfrp4e-core.items.wMwSRDmgiF2IdCJr");
  let data = item.toObject()
  this.actor.createEmbeddedDocuments("Item", [data], {fromEffect: this.effect.id})
  
  this.script.message(
  `<p><strong>${this.actor.prototypeToken.name}</strong>: Otrzymano cechę stworzenia "Nie Czuje Bólu". Ten efekt trwa przez godzinę, po czym znika, a wszystkie powstrzymywane dotychczas efekty ran uderzają jednocześnie.</p>
    <p>Uwaga: ten efekt nie chroni przed otrzymaniem trafienia krytycznego lub śmierci. Po prostu pozwala zignorować część efektów wynikających z Ran Krytycznych.</p>`, 
    { whisper: ChatMessage.getWhisperRecipients("GM"), blind: true})
}
