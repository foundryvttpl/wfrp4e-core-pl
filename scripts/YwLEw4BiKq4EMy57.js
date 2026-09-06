let i_gain = (await new Roll("2d10").roll()).total
let fel_gain = 0
if (args.actor.characteristics.fel.value <= 0)
{
   fel_gain += (await new Roll("2d10").roll()).total
}

let msg = `<b>${this.actor.prototypeToken.name}</b>: otrzymano punkty Inteligencji w liczbie: ${i_gain}`

if (fel_gain)
   msg += ` oraz Ogłady w liczbie: ${fel_gain}`


let newInt = i_gain + args.actor.characteristics.int.modifier
let newFel = fel_gain + args.actor.characteristics.fel.modifier

args.actor.update({"system.characteristics.int.modifier" : newInt, "system.characteristics.fel.modifier" : newFel})

this.script.message(msg)
