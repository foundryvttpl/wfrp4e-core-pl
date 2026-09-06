let criticals = this.actor.itemTypes.critical;

if (criticals.length)
{
  let choice = await ItemDialog.create(criticals, 1, {title: this.effect.name, text: "Wybierz Rana Krytyczna do wyleczenia"})

  if (choice[0])
  {
    this.script.message(`Wyleczono ${choice[0].name}`);
    choice[0].delete();
  }
}
else 
{
  this.script.notification("Brak Ran Krytycznych!")
}
