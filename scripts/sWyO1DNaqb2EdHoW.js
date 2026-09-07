if (!this.actor.items.getName(game.i18n.localize("NAME.Frenzy"))) // Either frenzy trait or psychology
{
  // Add Frenzy psychology
  let item = await fromUuid("Compendium.wfrp4e-core.items.DrNUTPeodEgpWTnT")
  let data = item.toObject();
  data.effects[0].disabled = false;
  this.actor.createEmbeddedDocuments("Item", [data], {fromEffect: this.effect.id})
}

this.script.message(`<p><strong>Po wypiciu tej mikstury, ${this.actor.prototypeToken.name}</strong> wpada w Szał Bojowy. Stan ten trwa [[1d10]] rund, i nie może zostać zakończony wcześniej.</p>`, 
  {whisper: ChatMessage.getWhisperRecipients("GM"), blind: true })
