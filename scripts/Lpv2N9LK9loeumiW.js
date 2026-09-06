if (this.actor.uuid != this.effect.sourceActor.uuid)
{
    this.actor.setupSkill(game.i18n.localize("NAME.Athletics"), {skipTargets: true, appendTitle :  ` - ${this.effect.name}`, fields : {difficulty: "hard"}, context : {failure : `<strong>${this.effect.name}</strong>: Nie można się poruszyć lub wykonać akcji`}}).then(test => {
       test.roll();
    })
}
