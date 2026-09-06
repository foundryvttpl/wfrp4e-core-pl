let stunned = this.actor.hasCondition("stunned")
if (stunned)
{
   this.script.notification(`Usunięto 1 Stan Oszołomienia`)
   this.actor.removeCondition("stunned");
}
else 
{
	this.script.notification(`Brak Stanów Oszołomienia do usunięcia`)
}
