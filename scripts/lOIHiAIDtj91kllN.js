const chanties = await warhammer.utility.findAllItems('wfrp4e-soc.chanty', "Wyszukuję Szanty", true);
let choice = await ItemDialog.create(chanties, 1, {text : "Wybierz Szanty", title : this.effect.name});
if (choice.length) 
{
  this.actor.addEffectItems(choice.map(i => i.uuid), this.effect)
}
