let item = await fromUuid("Compendium.wfrp4e-core.items.oGbDwnLOn3isPJpO")
let data = item.toObject();
data.name += " (Do ustalenia)"
this.actor.createEmbeddedDocuments("Item", [data], {fromEffect : this.effect.id})
