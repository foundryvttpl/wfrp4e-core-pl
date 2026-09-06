if (this.actor.hasCondition("stunned") || this.actor.hasCondition("unconscious"))
{
	this.script.notification("Przerwany!");
	await this.effect.update({"disabled" : true})
}
