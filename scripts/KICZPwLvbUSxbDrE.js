let table = game.wfrp4e.tables.findTable("mutatemental");
if (!table)
{
	ui.notifications.error("Nie odnaleziono tabeli o kluczu: mutatemental")
}
let result = (await table.roll()).results[0];
let uuid = `Compendium.${result.documentCollection}.${result.documentId}`
let item = await fromUuid(uuid);

if (item)
{
    this.script.notification(`Dodano: ${item.name}`)
    this.actor.createEmbeddedDocuments("Item", [item])
}
else 
{
    ui.notifications.error("Nie odnaleziono przddmiotu o kluczu: " + uuid)
}
