if (args.test.options.beatBlade && (args.test.result.roll <= game.settings.get("wfrp4e", "automaticSuccess") || args.test.result.roll <= args.test.target))
{
   args.test.result.other.push(`<b>${this.effect.name}</b>: Utracone Punkty Przewagi Przeciwnika: ${Number(args.test.result.SL) + 1}`)
}
