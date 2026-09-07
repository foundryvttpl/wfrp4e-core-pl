let column = await ValueDialog.create({text : "Wybierz kolumnę, aby rzucić i określić głowę Bestii", title : "Wybierz Kolumnę"}, "", ["Niepodzielny", "Khorne", "Nurgle", "Slaanesh", "Tzeentch"]);

if (column)
{
    let result = await game.wfrp4e.tables.rollTable("beasthead", {}, column);
    this.script.message(`<strong>${result.title}</strong><br>${result.result}`);
    let uuid = `Compendium.${result.object.documentCollection}.${result.object.documentId}`;
    let item = await fromUuid(uuid);
    if (item)
    {
        this.actor.createEmbeddedDocuments("Item", [item])
        this.item.delete();
    }
}
