let weapon = this.actor.itemTags["weapon"].find(i => i.system.isEquipped);
if (!weapon)
{
  this.script.notification("Brak wyposazonej broni!", "error");
  return;
}

if (await this.actor.spend("system.status.fortune.value", 1))
{
  let test = await this.actor.setupWeapon(weapon, {appendTitle : ` - ${this.effect.name}`, whirlwind: true});
  test.roll();
}
else 
{
  this.script.notification("Za malo Punktow Szczescia!", "error");
}
