if (!args.messageSent)
{
  args.messageSent = true;
  let advantage = this.item.effects.filter(i => i.name == this.effect.name).length;
  this.actor.setAdvantage(advantage)
  this.script.message(`Sojusznicy w zasiegu 6 jardow otrzymuja ${advantage} Przewagi`)
}
