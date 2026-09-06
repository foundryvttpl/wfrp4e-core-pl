if (args.context.dodge)
{
	args.abort = true;
	this.script.notification("Nie można unikać!")
}
return ["t", "int", "wp", "fel"].includes(args.characteristic)
