let msg = ""

let i_gain = (await new Roll("1d10").roll()).total

if (args.actor.characteristics.i.value <= 0)
{
   i_gain += (await new Roll("2d10").roll()).total
}

msg = `<b>${this.actor.prototypeToken.name}</b>: otrzymano punkty Inicjatywy w liczbie ${i_gain}`

let newValue = i_gain + args.actor.characteristics.i.modifier

this.actor.update({"system.characteristics.i.modifier" : newValue})


let hitloc = await game.wfrp4e.tables.rollTable("hitloc")

let value = hitloc.result
let desc = hitloc.description

this.effect.updateSource({"flags.wfrp4e.location" : value})

msg += ` gdy nowe oczy pojawiają się w lokacji: ${desc}`

this.script.message(msg)
