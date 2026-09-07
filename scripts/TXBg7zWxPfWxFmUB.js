if (args.type == "effect" && args.options.action == "create" && ["ablaze"].some(i => args.document.statuses.has(i)))
{
  this.script.notification("Odporny na " + args.document.name);
  return false;
}
