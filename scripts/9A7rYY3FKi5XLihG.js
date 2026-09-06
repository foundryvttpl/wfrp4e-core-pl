fromUuid("Compendium.wfrp4e-core.items.5QcrpLQWWrsbKR79").then(item => {
     let data = item.toObject();
     data.system.tests.value = data.system.tests.value.replace("monet", "metalowych przedmiotów");
     data.system.description.value += "<p>Ten talent jest rozszerzony również na dowolny metalowy obiekt ze względu na <strong>Metaliczne powinowactwo</strong></p>"
     this.actor.createEmbeddedDocuments("Item", [data], {fromEffect : this.effect.id})
})
