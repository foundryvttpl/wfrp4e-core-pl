let effects = this.item.effects.contents.filter(i => i.id != this.effect.id);

let choice = await ItemDialog.create(effects, 1, {title : this.effect.name, text: "Wybierz rune"});

if (choice[0])
{
  choice[0].performEffectApplication();
}
