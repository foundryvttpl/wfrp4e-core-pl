let shouldDamage = await foundry.applications.api.DialogV2.confirm({
  window : {title: this.effect.name + " - " + args.actor.name},
  content: "Czy jesteś humanoidalnym stworzeniem, które nie poświęciły się Rhyi (lub innej diety natury lub potężnego ducha natury, której kult Rhyi jest dobrze rozmieszczony, taki jak Isha lub Taal) od ostatniej wiosny równonocy?"
});

if (shouldDamage) {
  let damage = 1 + this.effect.sourceTest.result.baseSL;
  await args.actor.applyBasicDamage(damage, {damageType: game.wfrp4e.config.DAMAGE_TYPE.IGNORE_ALL});
  args.actor.addCondition("fatigued");
}
