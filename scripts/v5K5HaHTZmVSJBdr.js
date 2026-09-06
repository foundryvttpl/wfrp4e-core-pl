let bane = this.effect.specifier;
if (bane)
  return;
if (await this.script.dialog("Rzucic Zgube?"))
{
  let table = await fromUuid("Compendium.wfrp4e-archives2.tables.RollTable.wRfrOW5pRXRWM8Lb");
  if (table)
  {
    bane = (await table.draw()).results[0].name;
  }
  else
  {
    this.script.notification("Nie znaleziono tabeli Losowego Stworzenia!", "error");
  }
}

if (!bane)
{
  bane = await ValueDialog.create({text: "Podaj Zgube", title: this.effect.name}) 
}

if (bane)
{
  this.effect.updateSource({name: this.effect.setSpecifier(bane)});
}
