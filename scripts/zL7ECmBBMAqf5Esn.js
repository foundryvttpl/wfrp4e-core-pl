let hasMagazine = await foundry.applications.api.DialogV2.confirm({window : {title : this.effect.name}, content: "<p>Czy statek ma magazyn lub inny rodzaj przechowalni dla Prochu?</p>"});

if (!hasMagazine) return;

let roll = new Roll("d10");
await roll.evaluate();
// await roll.toMessage();
let anchor = roll.toAnchor();

let crits = [];

for (let i = 0; i < roll.total; i++) {
  let result = await WFRP_Tables.rollTable('crithull');
  let collection = game.packs.get(result.object.documentCollection)

  if (collection)
    await collection.getDocuments()

  if (!collection)
    collection = game.items;

    let item = collection.get(result.object.documentId)
    if (item)
      crits.push(item);
}

const items = await this.actor.createEmbeddedDocuments("Item", crits);
const speaker = ChatMessage.getSpeaker({actor: this.actor});
const uuids = items.map(i => `@UUID[${i.uuid}]`);
this.script.message(`<p><b>${this.item.name}</b> spowodował dodatkowo trafienia krytyczne w kadłub: ${anchor.outerHTML}!</p><ul><li>${uuids.join('<li>')}</ul>`)
