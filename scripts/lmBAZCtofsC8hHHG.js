let SL = 1;

do {
  const signedSL = SL >= 0 ? `+${SL}` : "SL";
  const content = `
  <div>
    <p style="font-weight: bold;">Zdobyto ${signedSL} PS. Czy chcesz rzucić k10?</p>
    <p>1–6: dodaj +1 PS</p>
    <p>7–10: Strać wszystkie PS i następny test wykonaj z -1 PS</p>
  </div>
`;
  const choice = await foundry.applications.api.DialogV2.confirm({
    yes: {label: "Rzuć", icon: "fas fa-dice"},
    no: {label: `Zachowaj ${signedSL} PS`, icon: "fas fa-check"},
    content,
  });

  if (!choice) break;

  const roll = new Roll("1d10");
  await roll.toMessage({flavor: this.effect.name});

  if (roll.total >= 7) {
    SL = -1;
    break;
  }

  SL++;
} while (true);

this.effect.setFlag("wfrp4e", "SL", SL);
