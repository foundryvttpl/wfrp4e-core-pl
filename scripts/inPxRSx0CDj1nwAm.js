if (args.test.result.fumble && !this.actor.itemTypes.talent.find(i => i.name == "Magia Tajemna (Ogień)"))
{
    this.actor.addCondition("ablaze");
}
