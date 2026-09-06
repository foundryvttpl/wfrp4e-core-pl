let item = await fromUuid("Compendium.wfrp4e-core.items.Item.vMYEkrWj0ip6ZOdv");
let data = item.toObject();
data.name += ` (Choroby)`;
this.actor.createEmbeddedDocuments("Item", [data], {fromEffect: this.effect.id})
