if (args.skill?.name == game.i18n.localize("NAME.Pray") || args.prayer)
{
  args.abort = true;
  this.script.notification("Nie mozna wykonywac Testow Modlitwy!")
}

return true;
