let test = this.actor.attacker?.test
if (test && this.item.system.protects[test.result.hitloc.result] && test.result.critical)
{
  this.script.message(`<strong>${this.item.name}</strong>: Rzuc Trafienie Krytyczne dwa razy i wybierz nizszy wynik.`)
}
