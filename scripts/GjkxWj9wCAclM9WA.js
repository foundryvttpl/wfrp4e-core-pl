let effects = foundry.utils.deepClone(this.item.effects.contents.filter(e => e.active));

effects.splice(effects.length - 1);

if (effects.length == 0)
{
    return this.script.notification("Wszystkie efekty zostały zastosowane. Zresetuj, aby je ponownie wybrać")
}
let choice = await ItemDialog.create(effects, 1, "Wybierz moc, którą chcesz zastosować");

if (choice[0])
{
    choice[0].update({disabled : true})
    let effect = choice[0].convertToApplied();
    effect.name += ` (${this.effect.name})`
    this.actor.createEmbeddedDocuments("ActiveEffect", [effect]);
}
