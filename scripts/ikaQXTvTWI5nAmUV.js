const excessSL = this.effect.sourceTest.result.baseSL - this.effect.sourceItem.system.sl;
let slToSpend = excessSL;

let levels = 0;
let duration = 0;

while (slToSpend > 0) {
  let content = `<p>Osiagnieto ${excessSL} PS i nadal pozostaje ${slToSpend} PS do wydania na wzmocnienie Tanca Miecza.</p>`;
  content += `<p>Dotad wybrano ${levels} dodatkowych poziomow w Przywodcy Wojennym oraz +${duration} Rund czasu trwania.</p>`;
  await foundry.applications.api.DialogV2.confirm({
    yes: {label: "Dodatkowy Przywodca Wojenny", icon: "fas fa-person", callback: () => levels++},
    no: {label: "+1 Runda czasu trwania", icon: "fas fa-clock", callback: () => duration++},
    content,
  });

  slToSpend--;
}

await this.actor.addEffectItems("Compendium.wfrp4e-core.items.Item.vCgEAetBMngR53aT", this.effect, {"system.advances.value": 1 + levels});
await this.effect.update({duration:{rounds: this.actor.system.characteristics.wp.bonus + duration}});
