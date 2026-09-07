let sourceActor = this.effect.sourceActor;
let damage = args.totalWoundLoss;
let tb = sourceActor.system.characteristics.t.bonus
args.abort = `<strong>${this.effect.name}</strong>: Zadano obrażenia: ${sourceActor.name}`;

let message = await sourceActor.applyBasicDamage(damage - tb, {damageType: game.wfrp4e.config.DAMAGE_TYPE.IGNORE_AP, suppressMsg : true})

this.script.message(message.replace(`${tb} Bomnus Wt`, `${tb} × 2 Bonus Wt`))
args.abort = true;
