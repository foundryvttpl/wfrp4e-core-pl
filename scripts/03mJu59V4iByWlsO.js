// The imbiber immediately
// takes 3 Poisoned Conditions that cannot be resisted at first,
await this.actor.addCondition("poisoned", 3)

// recovers a number of Wounds equal to their Toughness Bonus, 
await this.actor.modifyWounds(this.actor.system.characteristics.t.bonus)

// and acquires the Regenerate Creature Trait.
const hasRegenerate = this.actor.has("Regeneracja")
if (hasRegenerate === undefined) {
  fromUuid("Compendium.wfrp4e-core.items.SfUUdOGjdYpr3KSR").then(trait => {
    let traitItem = trait.toObject()
    this.actor.createEmbeddedDocuments("Item", [traitItem], {fromEffect: this.effect.id})
  })
}

this.script.message(`<p><strong>${this.actor.prototypeToken.name}</strong> otrzymuje: 
    <ul>
      <li>3 Stany Zatrucia, których początkowo nie można usunąć</li>
      <li>odzyskano liczbę ran: ${this.actor.system.characteristics.t.bonus}</li>
      <li>otrzymano cechę stworzenia "Regeneracja".</li>
    </ul>
    od Łaski Ranalda zależy, czy regeneracja okaże się silniejsza niż zatrucie.</p>
    <p>Kiedy wszystkie Stany Zatrucia zostaną usunięte, usuwana jest również cecha stworzenia Regeneracja.</p>`, 
    { whisper: ChatMessage.getWhisperRecipients("GM"), blind: true })
