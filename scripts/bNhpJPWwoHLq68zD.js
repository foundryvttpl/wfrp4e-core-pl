let actor = await DragDialog.create({title : this.effect.name, text : "Wskaz postac tatuatora (zamknij, aby pominac Testy)"})

if (!actor)
{
    this.script.notification("Pominieto Testy nakladania tatuazy");
    if (await foundry.applications.api.Dialog.confirm({
      window: {title: this.effect.name},
      content : "<p>Zastosowac efekt Ochrony Grimnira?</p>"
    }))
    {
      return;
    }
    else 
    {
      return false;
    }
}


let failed = false;
if (this.actor.itemTags.skill.find(i => i.name == "Lore (Theology)"))
{
  let test = await this.actor.setupSkill("Lore (Theology)", {appendTitle : ` - ${this.effect.name}`, fields : {difficulty : "vhard"}})
  await test.roll();
  if (test.failed)
  {
    failed = true;
  }
}
else 
{
  this.script.notification("Nie znaleziono Umiejetnosci Wiedza (Teologia), nie mozna zdac testu.")
  failed = true;
}

if (this.actor.itemTags.skill.find(i => i.name == "Lore (Runes)"))
  {
    let test = await this.actor.setupSkill("Lore (Runes)", {appendTitle : ` - ${this.effect.name}`, fields : {difficulty : "hard"}})
    await test.roll();
    if (test.failed)
    {
      failed = true;
    }
  }
  else 
  {
    this.script.notification("No Lore (Runes) skill found, cannot pass.")
    failed = true;
  }


  let test = await this.actor.setupSkill("Art (Tattooing)", {appendTitle : ` - ${this.effect.name}`})
  await test.roll();
  if (test.failed)
  {
    failed = true;
  }

  if (failed)
  {
    this.script.message("One or more Tests to apply the tattoos failed.")
    return false;
  }
  else
  {
    return true;
  }
