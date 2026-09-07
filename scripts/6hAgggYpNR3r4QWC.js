let item = await fromUuid("Compendium.wfrp4e-core.items.Q2MCUrG2HppMcvN0")
item = item.toObject()
let species = args.actor.Species || " twojego gatunku"
item.name = `Wrogość (wszyscy oprócz ${species})`
this.actor.createEmbeddedDocuments("Item", [item], {fromEffect : this.effect.id})
