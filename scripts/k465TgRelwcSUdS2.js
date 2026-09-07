if (this.actor.has("Trade (Engineering)", "skill"))
{
  let aim = await this.actor.setupSkill("Trade (Engineering)", {appendTitle : ` - Aim ${this.item.name}`});
  await aim.roll();
  let SL = Number(aim.result.SL);
  let context = {}
  if (SL < 0)
  {
    context.fields = {modifier : 10 * SL};
    context.initialTooltip = "Nieudane Rzemioslo (Inzynieria)"
  }

  let fire = await this.actor.setupWeapon(this.item, context)
  fire.roll();
}
else
{
  this.script.notification("Ta postac nie ma Umiejetnosci Rzemioslo (Inzynieria)!", "error");
}
