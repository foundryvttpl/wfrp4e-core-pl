if (args.extendedTest?.getFlag("wfrp4e", "fear"))
{
	this.script.notification("Niewrażliwy na Strach");
	args.extendedTest.delete();
	args.abort = true;
}
