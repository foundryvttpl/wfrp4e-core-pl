if (args.type == "effect" && args.options.action == "delete" && ["fatigued"].some(i => args.document.statuses.has(i)))
{
  this.script.notification("Nie mozna usunac " + args.document.name);
  return false;
}
