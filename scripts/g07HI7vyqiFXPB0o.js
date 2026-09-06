// A Drinker must take a Difficult (-10) Endurance Test.
let test = await this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, fields: {difficulty: "difficult"}})
await test.roll()
// If they fail, they acquire 2 Poisoned Conditions. 
if (test.failed) 
{
    this.actor.addCondition("poisoned", 2)
    this.script.message(`<p><strong>${this.actor.prototypeToken.name}</strong> otrzymuje 2 Poziomy Stanu @Condition[Zatrucie].</p>
        <p>Każde stworzenie cechą Zwierzęcy, która ugryzie ofiarę i otrzyma obrażenia, nie ugryzie ponownie podczas trwającego starcia, chociaż stworzenie może nadal atakować na inne sposoby.</p>`, 
    {
      whisper: ChatMessage.getWhisperRecipients("GM"), 
      blind: true 
    })
}
  // If they succeed, for a number of rounds equal to 3+ their SL, they have the Corrosive Blood Creature Trait.
else if (test.succeeded) 
{
    // Don't attempt to add Corrosive Blood if actor already has it
    const hasCorrosiveBlood = this.actor.has("Kwasowa Krew")
    if (hasCorrosiveBlood !== undefined) return   

    let item = await fromUuid("Compendium.wfrp4e-core.items.M5QSWOYt2Rbv2yxW")
    let data = item.toObject()
    this.actor.createEmbeddedDocuments("Item", [data], {fromEffect: this.effect.id})
    
    const duration = 3 + parseInt(test.result.SL)
    this.script.message(`<p><strong>${this.actor.prototypeToken.name}</strong> otrzymuje Kwasową Krew na liczbę rund: ${duration}.</p>`, 
      { whisper: ChatMessage.getWhisperRecipients("GM"), blind: true })    
}
