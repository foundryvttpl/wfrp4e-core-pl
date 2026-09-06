let difficulty = ""
                            if (this.effect.name.includes("Umiarkowany"))
                                difficulty = "easy"
                            else if (this.effect.name.includes("Poważny"))
                                difficulty = "average"
                            else
                                difficulty = "veasy"
        
                            let test = await this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {context : {failure : this.actor.name + " umiera z powodu Uwiądu"}, fields: {difficulty}, appendTitle : " - Uwiąd"})
                            await test.roll();
                            if (test.failed)
                            {
                                this.actor.addCondition("dead");
                            }
