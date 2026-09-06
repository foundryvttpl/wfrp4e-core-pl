if (!this.actor.has("Widzenie w Ciemności") && !this.actor.has("Widzenie w Ciemności", "talent") && !this.actor.hasCondition("blinded"))
{
    this.actor.addCondition("blinded", 1, {"flags.wfrp4e.nightshroud" : true})
}
