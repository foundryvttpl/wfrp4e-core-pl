let poisoned = args.actor.hasCondition("poisoned")
if (poisoned)
{
   this.script.notification(`Usunięto liczbę stanów Zatrucia: ${poisoned.conditionValue}`)
   poisoned.delete();  
}
else
  this.script.notification(`Brak stanów Zatrucia`)
