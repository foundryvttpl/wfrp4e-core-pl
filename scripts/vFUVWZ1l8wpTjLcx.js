if (!this.actor.has(game.i18n.localize("NAME.Daemonic")))
    return

let caster = this.effect.sourceActor;
if (caster) 
{
    let wp = caster.system.characteristics.wp
    if (this.actor.system.characteristics.wp.value >= wp.value)
    {
        this.script.notification("Cel ma wyższą Siłę Woli, brak efektu")
        return
    }
    this.actor.applyBasicDamage(wp.bonus, { damageType: game.wfrp4e.config.DAMAGE_TYPE.IGNORE_ALL })
}
