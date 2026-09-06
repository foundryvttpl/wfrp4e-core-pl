if (args.test.options.staunchBleeding) 
{
 if (args.test.succeeded) 
 {
   let staunch =  Number(args.test.result.SL) + 1
   if (args.test.options.fieldDressing && args.test.result.reversed)
   {
     staunch =  Math.min(1, Number(args.test.result.SL)) + 1
   }
   args.test.result.other.push(`<b>${this.actor.name}</b>: usunięto pacjentowi liczbę stanów krwawienia równą: <b>${staunch}</b>.`)
 }
   else if (this.actor.characteristics.int.bonus + Number(args.test.result.SL) < 0)
   {
      args.test.result.other.push(`Pacjent otrzymuje @UUID[Compendium.wfrp4e-core.items.Item.1hQuVFZt9QnnbWzg]{Pomniejszą Infekcję}.`)
   }
}
