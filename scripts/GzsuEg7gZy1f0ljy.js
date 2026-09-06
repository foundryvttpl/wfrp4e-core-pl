let bleeding = this.actor.hasCondition("bleeding")
if (bleeding)
{
   this.script.notification(`Usunięte Stany Krwawienia: ${bleeding.conditionValue}`)
   bleeding.delete();  
}
else 
{
   this.script.notification(`Brak stanów krwawienia`)
}
