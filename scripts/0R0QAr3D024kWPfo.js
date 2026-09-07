let table = game.wfrp4e.tables.findTable("mutatephys");
if (!table)
{
	return ui.notifications.error("Nieodnaleziono tabeli Mutacji, upewnij się, że tabla o kluczu `mutatephys` jest zaimportowana do świata.")
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
    ui.notifications.error("Nie odnaleziono przedmiotu: " + uuid)
}
