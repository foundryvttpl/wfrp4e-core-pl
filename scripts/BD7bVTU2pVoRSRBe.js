let symptoms = {
    convulsions : "Konwulsje",
    coughsandsneezes : "Kaszel i Katar",
    fever : "Gorączka",
    flux : "Biegunka",
    nausea : "Mdłości"
}

let roll = await (new Roll(`max(0, 1d10 - ${this.actor.characteristics.wp.bonus})`).roll())
roll.toMessage(this.script.getChatData());

let choices = await ItemDialog.create(ItemDialog.objectToArray(symptoms), roll.total, "Wybierz Symptom");

if (choices.length)
{
    let symptomEffects = foundry.utils.duplicate(game.wfrp4e.config.symptomEffects)
    let added = []
    for(let choice of choices)
    {
        let symptom = symptomEffects[choice.id];
        symptom.origin = this.effect.uuid;
        added.push(symptom);
    }
    this.actor.createEmbeddedDocuments("ActiveEffect", added)
}
else 
{
    this.effect.delete();
}
