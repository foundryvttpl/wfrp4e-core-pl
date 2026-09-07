if (args.type == "effect" && args.options.action == "delete" && ["blinded"].some(i => args.document.statuses.has(i)))
{
  this.script.notification("Nie mozna usunac " + args.document.name);
  return false;
}
