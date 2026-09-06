let fatigued = this.actor.hasCondition("fatigued")
                            if (!fatigued)
                            {
                                this.actor.addCondition("fatigued")
                                ui.notifications.notify("Dodano Zmeczenie: " + this.actor.name + " which cannot be removed until the Malaise symptom is gone.")
                            }
