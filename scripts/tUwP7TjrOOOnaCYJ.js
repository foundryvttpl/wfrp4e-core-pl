let fatigued = this.actor.hasCondition("fatigued")
if (fatigued)
{
   this.script.notification(`Usunięte Stany Zmęczenia: ${fatigued.conditionValue}`)
   fatigued.delete();  
}
else 
{
	this.script.notification(`Brak Stanów Zmęczenia do usunięcia`)
}
