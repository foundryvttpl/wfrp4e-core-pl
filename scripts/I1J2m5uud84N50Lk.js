if (["cast", "channelling", "pray"].includes(args.type))
{
	args.abort = true;
	this.script.notification("Nie można rzucić zaklęć ani modlitw");
}
else return true;
